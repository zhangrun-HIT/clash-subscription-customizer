var MANUAL_GROUP_NAME = "Proxy";
var AUTO_GROUP_NAME = "自动选择";
var TARGET_GROUP_NAMES = ["Others", "Global_media", "China_media"];

function isHongKongNodeName(name) {
  if (typeof name !== "string") {
    return false;
  }
  return /(?:🇭🇰|香港|Hong\s*Kong|\bHK\b)/i.test(name);
}

function cleanGroupProxies(group, removedNames) {
  if (!group || !Array.isArray(group.proxies)) {
    return;
  }

  group.proxies = group.proxies.filter(function (name) {
    return !removedNames[name];
  });
}

function replaceProxyReference(group, fromName, toName) {
  if (!group || !Array.isArray(group.proxies)) {
    return;
  }

  group.proxies = group.proxies.map(function (name) {
    return name === fromName ? toName : name;
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

function main(config) {
  if (!config || typeof config !== "object") {
    return config;
  }

  var removedNames = Object.create(null);

  if (Array.isArray(config.proxies)) {
    config.proxies = config.proxies.filter(function (proxy) {
      var name = proxy && typeof proxy.name === "string" ? proxy.name : "";
      if (isHongKongNodeName(name)) {
        removedNames[name] = true;
        return false;
      }
      return true;
    });
  }

  var proxyGroups = config["proxy-groups"];
  if (!Array.isArray(proxyGroups)) {
    return config;
  }

  proxyGroups.forEach(function (group) {
    cleanGroupProxies(group, removedNames);
  });

  var manualGroup = findPreferredManualGroup(proxyGroups);
  if (!manualGroup || !Array.isArray(manualGroup.proxies) || manualGroup.proxies.length === 0) {
    return config;
  }

  proxyGroups = proxyGroups.filter(function (group) {
    return !(group && group.name === AUTO_GROUP_NAME);
  });

  var autoGroup = createAutoProxyGroup(manualGroup.proxies);
  proxyGroups.splice(proxyGroups.indexOf(manualGroup) + 1, 0, autoGroup);

  proxyGroups.forEach(function (group) {
    if (group && TARGET_GROUP_NAMES.indexOf(group.name) !== -1) {
      replaceProxyReference(group, MANUAL_GROUP_NAME, AUTO_GROUP_NAME);
    }
  });

  config["proxy-groups"] = proxyGroups;
  return config;
}
