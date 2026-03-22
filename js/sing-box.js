const { type, name } = $arguments
/**
 * 兼容版 Sing-box 自动填充脚本 (解决 undefined 报错)
 */

async function main() {
    // --- 1. 安全获取参数 ---
    let args = {};
    if (typeof $arguments !== 'undefined' && $arguments) {
        args = $arguments;
    } else {
        // 如果 $arguments 为空，尝试从全局变量读取或设为默认值
        args = { name: "default", type: "0" };
    }

    const name = args.name || "share"; // 默认值设为 share 防止 undefined
    const type = args.type || "0";
    const isCollection = /^1$|col/i.test(String(type));

    console.log(`正在获取: ${isCollection ? '组合' : '订阅'} - ${name}`);

    // --- 2. 获取订阅节点数据 ---
    let proxies = [];
    try {
        proxies = await produceArtifact({
            name: name,
            type: isCollection ? 'collection' : 'subscription',
            platform: 'sing-box',
            produceType: 'internal',
        });
    } catch (e) {
        console.log("获取节点失败: " + e.message);
        proxies = [];
    }

    // --- 3. 解析原始配置文件 ---
    let config;
    try {
        config = JSON.parse($files[0]);
    } catch (e) {
        console.log("JSON 解析失败，请检查配置文件格式");
        $content = $files[0];
        return;
    }

    // --- 4. 执行注入逻辑 ---
    if (!config.outbounds) config.outbounds = [];
    
    // 注入节点对象
    config.outbounds.push(...proxies);

    // 获取所有节点 tag
    const proxyTags = proxies.map(p => p.tag);

    // 填充【默认代理】和【自动选择】
    if (Array.isArray(config.outbounds)) {
        config.outbounds.forEach(outbound => {
            if (outbound.tag === '默认代理' || outbound.tag === '自动选择') {
                if (!Array.isArray(outbound.outbounds)) {
                    outbound.outbounds = [];
                }
                // 将新节点追加进去
                outbound.outbounds.push(...proxyTags);
            }
        });
    }

    // --- 5. 输出结果 ---
    $content = JSON.stringify(config, null, 2);
}

// 执行
main().catch(err => {
    console.log('脚本执行崩溃: ' + err.message);
    $content = $files[0];
});
