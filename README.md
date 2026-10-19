# Reflex English

一个把 1000 句中英对照素材做成“听、想、说”反射训练的静态网站。视觉语言参考了 [Ogden's Basic English](https://ogden.munch.love/) 的暖纸张、衬线字体和分类卡片风格，内容结构则围绕整句练习重新设计。

在线版本：<https://linhf123.github.io/reflex-english/>

## 本地运行

```bash
npm run dev
```

然后打开 <http://127.0.0.1:5173>。

也可以直接打开 `index.html`，但建议使用本地服务器，以确保浏览器正确加载数据文件。

## 功能

- 1000 句完整中英对照素材，按 10 个生活场景分组
- 英文、中文即时搜索，场景与学习状态筛选
- 美式 / 英式发音切换，可调朗读语速
- 连续听全部 1000 句，右侧浮动窗显示当前句子，并可直接收藏或标记掌握
- 中文回想与英文听写两种卡片练习
- 收藏、已掌握、待掌握状态，以及每日一句
- 浅色 / 深色主题，响应式手机布局
- 学习进度保存在浏览器 `localStorage`，无需登录或后端
- 键盘快捷键：`⌘/Ctrl + K` 搜索、`Space` 播放、`Enter` 揭晓或下一句

## 数据与结构

- `data/source.md`：原始 1000 句素材
- `data/sentences.js`：由脚本生成的结构化数据
- `scripts/build-data.mjs`：重新生成句子数据
- `index.html`、`styles.css`、`app.js`：网站主体

修改 `data/source.md` 后运行：

```bash
npm run build:data
```
