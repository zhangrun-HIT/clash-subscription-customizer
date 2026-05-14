# Clash Subscription Customizer

这个仓库用于存放本地 `Clash Verge Rev` 的 Script 配置脚本。

当前脚本会做这些事情：

- 删除香港节点
- 清理各代理组里对香港节点的引用
- 对代理组里的节点引用做去重，避免多次刷新后重复追加
- 保留 `Proxy` 作为手动选择组，并把 `自动选择` 放到 `Proxy` 的第一项
- 新增 `自动选择` 组，类型为 `url-test`
- `自动选择` 只会使用真实节点，不会把其他代理组名加入进去，避免循环引用
- 刷新时会先移除旧的 `自动选择` 组，再按当前节点重新创建
- 把 `Others`、`Global_media`、`China_media` 里原本指向 `Proxy` 的地方改成指向 `自动选择`，并把 `自动选择` 放到这些组的第一项
- 默认把规则中指向 `Proxy`、`Others`、`Global_media`、`China_media` 的策略改成 `自动选择`，避免客户端缓存了旧手动选择后仍然走旧节点

如果你只想创建 `自动选择` 组，但不想改写规则，可以把脚本里的这一行改成 `false`：

```js
var REWRITE_RULES_TO_AUTO = true;
```

脚本文件：

- `clash-verge-script.js`

在 Clash Verge Rev 里使用时：

1. 保留你的原始远程订阅作为 `Remote` 配置
2. 新建一个 `Script` 配置
3. 导入或粘贴 `clash-verge-script.js`
4. 启用这个 `Script` 配置并刷新订阅
