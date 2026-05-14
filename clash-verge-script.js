var MANUAL_GROUP_NAME = "Proxy";
var AUTO_GROUP_NAME = "自动选择";
var TARGET_GROUP_NAMES = ["Others", "Global_media", "China_media"];
var RULE_GROUP_NAMES_TO_AUTO = [MANUAL_GROUP_NAME].concat(TARGET_GROUP_NAMES);
var REWRITE_RULES_TO_AUTO = true;
var RULE_TRAILING_OPTIONS = {
  "no-resolve": true
};

function isHongKongNodeName(name) {
  if (typeof name !== "string") {
    return false;
  }
  return /(?:🇭🇰|香港|Hong\s*Kong|\bHK\b)/i.test(name);
}

function createNameMap(names) {
  var nameMap = Object.create(null);

  if (!Array.isArray(names)) {
    return nameMap;
  }

  names.forEach(function (name) {
    if (typeof name === "string" && name) {
      nameMap[name] = true;
    }
  });

  return nameMap;
}

function uniqueNames(names) {
  var unique = [];
  var seen = Object.create(null);

  if (!Array.isArray(names)) {
    return unique;
  }

  names.forEach(function (name) {
    if (typeof name !== "string" || !name || seen[name]) {
      return;
    }

    seen[name] = true;
    unique.push(name);
  });

  return unique;
}

function cleanGroupProxies(group, removedNames) {
  if (!group || !Array.isArray(group.proxies)) {
    return;
  }

  group.proxies = uniqueNames(group.proxies.filter(function (name) {
    return !removedNames[name];
  }));
}

function replaceProxyReference(group, fromName, toName) {
  if (!group || !Array.isArray(group.proxies)) {
    return;
  }

  group.proxies = group.proxies.map(function (name) {
    return name === fromName ? toName : name;
  });
  group.proxies = uniqueNames(group.proxies);
}

function prependProxyReference(group, proxyName) {
  if (!group || !Array.isArray(group.proxies) || typeof proxyName !== "string" || !proxyName) {
    return;
  }

  group.proxies = uniqueNames([proxyName].concat(group.proxies));
}

function collectProxyNames(proxies) {
  if (!Array.isArray(proxies)) {
    return [];
  }

  return uniqueNames(proxies.map(function (proxy) {
    var name = proxy && typeof proxy.name === "string" ? proxy.name : "";
    return name;
  }));
}

function collectPreferredProxyNames(preferredNames, availableNameMap) {
  var proxyNames = [];
  var seen = Object.create(null);

  if (!Array.isArray(preferredNames)) {
    return proxyNames;
  }

  preferredNames.forEach(function (name) {
    if (typeof name !== "string" || !availableNameMap[name] || seen[name]) {
      return;
    }

    seen[name] = true;
    proxyNames.push(name);
  });

  return proxyNames;
}

function removeProxyGroupByName(proxyGroups, groupName) {
  if (!Array.isArray(proxyGroups)) {
    return [];
  }

  return proxyGroups.filter(function (group) {
    return !(group && group.name === groupName);
  });
}

function createAutoProxyGroup(proxyNames) {
  return {
    name: AUTO_GROUP_NAME,
    type: "url-test",
    proxies: proxyNames.slice(),
    url: "https://www.gstatic.com/generate_204",
    interval: 300,
    tolerance: 50,
    lazy: false,
    timeout: 5000,
    "expected-status": 204
  };
}

function findPreferredManualGroup(proxyGroups) {
  var preferred = null;

  proxyGroups.forEach(function (group) {
    if (!preferred && group && group.name === MANUAL_GROUP_NAME) {
      preferred = group;
    }
  });

  if (preferred) {
    return preferred;
  }

  proxyGroups.forEach(function (group) {
    if (!preferred && group && Array.isArray(group.proxies) && group.proxies.length > 0) {
      preferred = group;
    }
  });

  return preferred;
}

function configureManagedGroups(proxyGroups, manualGroup) {
  if (manualGroup) {
    prependProxyReference(manualGroup, AUTO_GROUP_NAME);
  }

  proxyGroups.forEach(function (group) {
    if (!group || TARGET_GROUP_NAMES.indexOf(group.name) === -1) {
      return;
    }

    replaceProxyReference(group, MANUAL_GROUP_NAME, AUTO_GROUP_NAME);
    prependProxyReference(group, AUTO_GROUP_NAME);
  });
}

function findRulePolicyIndex(parts) {
  var policyIndex = parts.length - 1;

  while (
    policyIndex > 0 &&
    RULE_TRAILING_OPTIONS[String(parts[policyIndex]).trim().toLowerCase()]
  ) {
    policyIndex -= 1;
  }

  return policyIndex > 0 ? policyIndex : -1;
}

function replaceRulePolicy(rule, policyNameMap, toName) {
  var parts;
  var policyIndex;
  var policyName;

  if (typeof rule !== "string") {
    return rule;
  }

  parts = rule.split(",");
  if (parts.length < 2) {
    return rule;
  }

  policyIndex = findRulePolicyIndex(parts);
  if (policyIndex === -1) {
    return rule;
  }

  policyName = String(parts[policyIndex]).trim();
  if (!policyNameMap[policyName]) {
    return rule;
  }

  parts[policyIndex] = toName;
  return parts.join(",");
}

function rewriteRulesToAuto(config) {
  var policyNameMap;

  if (!REWRITE_RULES_TO_AUTO || !Array.isArray(config.rules)) {
    return;
  }

  policyNameMap = createNameMap(RULE_GROUP_NAMES_TO_AUTO);
  config.rules = config.rules.map(function (rule) {
    return replaceRulePolicy(rule, policyNameMap, AUTO_GROUP_NAME);
  });
}

function main(config) {
  if (!config || typeof config !== "object") {
    return config;
  }

  var removedNames = Object.create(null);
  var availableProxyNames = [];

  if (Array.isArray(config.proxies)) {
    config.proxies = config.proxies.filter(function (proxy) {
      var name = proxy && typeof proxy.name === "string" ? proxy.name : "";
      if (isHongKongNodeName(name)) {
        removedNames[name] = true;
        return false;
      }
      return true;
    });

    availableProxyNames = collectProxyNames(config.proxies);
  }

  var proxyGroups = Array.isArray(config["proxy-groups"]) ? config["proxy-groups"] : [];

  proxyGroups.forEach(function (group) {
    cleanGroupProxies(group, removedNames);
  });

  proxyGroups = removeProxyGroupByName(proxyGroups, AUTO_GROUP_NAME);
  var manualGroup = findPreferredManualGroup(proxyGroups);

  var availableNameMap = createNameMap(availableProxyNames);

  var autoProxyNames = manualGroup
    ? collectPreferredProxyNames(manualGroup.proxies, availableNameMap)
    : [];
  if (autoProxyNames.length === 0) {
    autoProxyNames = availableProxyNames.slice();
  }

  if (autoProxyNames.length === 0) {
    return config;
  }

  var autoGroup = createAutoProxyGroup(autoProxyNames);
  var insertIndex = manualGroup ? proxyGroups.indexOf(manualGroup) + 1 : 0;
  proxyGroups.splice(insertIndex, 0, autoGroup);

  configureManagedGroups(proxyGroups, manualGroup);
  rewriteRulesToAuto(config);

  config["proxy-groups"] = proxyGroups;
  return config;
}
