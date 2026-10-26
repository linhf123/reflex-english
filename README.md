# Reflex English

一个以“听、想、说”为核心的英语学习静态站点。视觉语言参考了 [Ogden's Basic English](https://ogden.munch.love/) 的暖纸张、衬线字体和分类卡片风格，包含句子反射训练与 COCA 高频词库两个栏目。

- 句子训练：<https://linhf123.github.io/reflex-english/>
- COCA 5000：<https://linhf123.github.io/reflex-english/coca/>

## 本地运行

```bash
npm run dev
```

然后打开 <http://127.0.0.1:5173>。

也可以直接打开 `index.html`，但建议使用本地服务器，以确保浏览器正确加载数据文件。

## 句子训练

- 1000 句完整中英对照素材，按 10 个生活场景分组
- 中文释义默认隐藏，先看英文自己想意思，点击卡片原地展开 / 收起（不引起重排）；导航栏可一键「全部显示 / 全部隐藏」，选择记在本地
- 搜索中文时自动展开释义，避免搜到看不见的匹配项
- 英文、中文即时搜索，场景与学习状态筛选
- 美式 / 英式发音切换，默认优先使用原有 Samantha / Daniel 等系统音色；播放失败时自动降级为本地语音
- Windows Chrome 优先使用本地英文语音，缺少语音包或网络语音失败时会给出明确提示
- 连续听全部 1000 句，右侧浮动窗显示当前句子，进度条可拖动跳转，并可直接收藏或标记掌握
- 中文回想与英文听写两种卡片练习
- 收藏、已掌握、待掌握状态，以及每日一句
- 浅色 / 深色主题，响应式手机布局
- 移动端连续听会尝试保持屏幕常亮；真正息屏后的后台播放仍受 iOS / Android 浏览器限制
- 学习进度保存在浏览器 `localStorage`，无需登录或后端
- 键盘快捷键：`⌘/Ctrl + K` 搜索、`Space` 播放、`Enter` 揭晓或下一句

## COCA 5000

- 5000 个 COCA 词元词性条目，覆盖 4333 个不同拼写
- 按排名、词性、学习状态和语域均衡度浏览
- 连续听全部 5000 词，右侧浮窗支持可拖动进度、上一词/下一词、收藏、掌握和定位
- 10 词听写练习，支持发音播放、拼写核对、掌握评级和会话总结
- 每条词频记录包含每百万词频次、语料覆盖、离散度和 8 类语域分布
- 5000 条词频条目均带有中文释义，支持中文搜索并显示在词卡、详情、每日一词、连续听浮窗和听写提示中
- 美式 / 英式发音、收藏、掌握状态、每日一词和随机一词
- 单词详情提供完整语域图和剑桥中英词典、YouGlish 延伸入口
- COCA 学习进度使用独立的 `localStorage` 键，不与句子训练混在一起

COCA 原始仓库没有声明软件或数据许可证，README 说明数据转载自
<https://www.wordfrequency.info/>。公开使用或再分发前应确认上游数据条款。

## 数据与结构

- `data/source.md`：原始 1000 句素材
- `data/sentences.js`：由脚本生成的结构化数据
- `scripts/build-data.mjs`：重新生成句子数据
- `index.html`、`styles.css`、`app.js`：网站主体
- `coca/`：COCA 5000 子站
- `data/coca-source.csv`：COCA 词频原始数据
- `data/coca-zh.csv`：从 ECDICT 提取的 4333 个不同拼写中文释义
- `data/ECDICT-LICENSE.txt`：ECDICT MIT 许可证
- `data/coca-5000.js`：由脚本生成的 5000 条词频数据
- `scripts/build-coca-data.mjs`：重新生成 COCA 数据
- `shared/tokens.css`：两个栏目共用的设计变量

修改 `data/source.md` 后运行：

```bash
npm run build:data
```

重新生成 COCA 数据：

```bash
npm run build:coca
```
