# Clash Subscription Customizer

这个仓库用于存放本地 `Clash Verge Rev` 的 Script 配置脚本。

当前脚本会做这些事情：

- 删除香港节点
- 清理各代理组里对香港节点的引用
- 保留 `Proxy` 作为手动选择组
- 新增 `自动选择` 组，类型为 `url-test`
- 把 `Others`、`Global_media`、`China_media` 里原本指向 `Proxy` 的地方改成指向 `自动选择`

脚本文件：

- `clash-verge-script.js`

在 Clash Verge Rev 里使用时：

1. 保留你的原始远程订阅作为 `Remote` 配置
2. 新建一个 `Script` 配置
3. 导入或粘贴 `clash-verge-script.js`
4. 启用这个 `Script` 配置并刷新订阅
