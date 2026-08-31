# 五十心所 · 每日省察

唯识心所日志打卡与自我检测工具（PWA 静态网页，纯前端、无后端、无依赖）。

> **设计理念**：理论学习再详细，终究要记录比对在行动里。每日以五十一心所为镜，
> 省察自心起念：善心所与不善心所分单元对照，「择善去非」正是心性修养的日常功夫。

## 功能

### 一、今日打卡
- **单元一 · 择善（善心所对照，11 条）**
  信、惭、愧、无贪、无嗔、无痴、精进、轻安、不放逸、行舍、不害，
  各与其对治之不善心所（不信、无惭、无愧、贪、嗔、痴、懈怠、惛沉、放逸、掉举、害）并观，
  每日自择所处：**善现前 / 平·无记 / 恶现前**。
  > 「无惭愧及不信等，与上善法相返，义相对照可知。」——憨山《百法论义》
- **单元二 · 去非（独立不善心所，15 条）**
  慢、疑、恶见、忿、恨、覆、恼、嫉、悭、诳、谄、憍、失念、散乱、不正知，
  逐条省察今日显现之轻重：**未现 / 微现 / 明显 / 炽盛**。
- **省思札记**：今日省思 + 明日所修，落在文字，对照行动。
- 保存后即时给出当日**善分（/11）、不善分（/45）与日评**。

### 二、回顾
- 统计卡：累计打卡、连续打卡、近 7 日善分均值与不善均分
- 三十日趋势双线图（善分 / 不善分）
- 近三十日**不善心所排行**（问题所在）与**善法现前排行**（进步所在）
- 打卡日历（按日评着色，点击日期可回看补记）
- 数据导出 / 导入备份（JSON）、清空

### 三、心所词典
- 六位五十一心所总览（遍行 5 · 别境 5 · 善 11 · 烦恼 6 · 随烦恼 20 · 不定 4）
- 逐一释义（体性、业用），善法附憨山《百法论义》按语

## 义理依据
| 内容 | 出处 |
|---|---|
| 六位心所分类与定义 | 玄奘译《成唯识论》卷五、卷六（依个人笔记《成唯识论纲要》） |
| 善法与不善法对治关系、按语 | 憨山德清《百法论义》 |
| 心所法伦理属性总论 | 陈兵《佛教心理学》上册 |

---

## 部署到 Cloudflare Pages

三种方式，任选其一。方式三（GitHub 自动部署）适合长期维护，配置文件已备好在仓库中。

### 方式一：拖拽上传（最快，无需命令行）

1. 打开 [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Pages** → **Upload assets**
2. 将 `xinsuo-check-deploy.zip`（或解压后 `index.html` 所在的那一层文件夹）拖入上传区
3. 填项目名（如 `xinsuo-check`）→ **Deploy**，完成

> 拖拽上传支持 zip 或文件夹；限 1000 个文件、单文件 ≤ 25 MiB（本项目仅 11 个文件，远低于上限）。

### 方式二：Cloudflare Pages Git 集成（控制台操作，无需仓库配置文件）

1. Cloudflare Pages → **Create** → **Pages** → **Connect to Git** → 选 GitHub 仓库
2. 构建配置：
   - Framework preset：**None**
   - Build command：**留空**（纯静态，无构建步骤）
   - Build output directory：**`/`**（仓库根目录即站点根，见下方仓库结构要求）
3. **Save and Deploy**，之后每次 push 到 main 分支自动更新

> 要求仓库根目录直接包含 `index.html`（不要嵌套一层文件夹）。

### 方式三：GitHub Actions 自动部署（push 即更新，推荐）

仓库已包含 `.github/workflows/deploy.yml`，push 到 `main` 分支即自动部署。

#### 1. 仓库结构要求

将本项目内容直接置于 GitHub 仓库根目录（`index.html` 在根，`js/`、`css/`、`icons/`、`sw.js`、`manifest.json` 同级）：

```
你的仓库/
├── index.html          ← 必须在根目录
├── js/
├── css/
├── icons/
├── sw.js
├── manifest.json
├── .github/workflows/deploy.yml
└── README.md
```

#### 2. 配置 GitHub Secrets（一次性）

仓库 **Settings → Secrets and variables → Actions → New repository secret**，添加两项：

| Secret 名 | 值 | 获取位置 |
|---|---|---|
| `CLOUDFLARE_API_TOKEN` | API 令牌 | Cloudflare → 右上角头像 → **My Profile** → **API Tokens** → Create Token → 模板选 **Edit Cloudflare Workers** 后**追加权限 `Account > Cloudflare Pages > Edit`**，Account Resources 选你的账户 |
| `CLOUDFLARE_ACCOUNT_ID` | 账户 ID | dash.cloudflare.com 首页右侧栏，或任意 Workers & Pages 页面 URL 中的 `account_id` |

> ⚠️ 令牌权限必须包含 **Cloudflare Pages: Edit**，否则部署会报权限错误。

#### 3. 首次部署

- 若 Cloudflare 尚无同名 Pages 项目：直接 push，wrangler 会自动创建项目并部署
- 若想自定义项目名：修改 `.github/workflows/deploy.yml` 中 `--project-name=xinsuo-check` 的值

之后每次 `git push` 到 main，GitHub Actions 自动构建并部署，无需任何手动操作。

### 部署后

- 自动获得 HTTPS 域名 `https://<项目名>.pages.dev`
- 手机浏览器打开 → 「添加到主屏幕」→ 如同 App 使用，离线可用
- 打卡数据保存在**浏览器 localStorage**，与托管平台无关，隐私无忧

### 更新提示（重要）

`sw.js` 采用缓存优先策略。**每次修改代码后重新部署时，记得把 `sw.js` 里的缓存版本号 `CACHE = 'xinsuo-v1'` 改为 `v2`、`v3`……**，否则已访问过旧版的设备会继续使用缓存，看不到更新。

---

## 本地预览

```bash
cd xinsuo-check
python3 -m http.server 8000
# 浏览器打开 http://localhost:8000
```

> PWA 的 Service Worker 离线能力要求 HTTPS 或 localhost；若直接双击 `index.html`（file:// 协议）打开，页面可用但无离线缓存与安装能力。

## 数据说明
- 所有记录保存在**本机浏览器 localStorage**，不上传任何服务器。
- 更换设备或清理浏览器缓存前，请先在「回顾 → 数据管理」导出备份 JSON。
- 导入备份会合并记录，同名日期覆盖。

## 技术栈
原生 HTML / CSS / JavaScript，无任何外部依赖；PWA（manifest + Service Worker）；
数据存储 localStorage；图表为原生 Canvas 绘制。全部文件可直接部署。

## 文件结构
```
xinsuo-check/
├── index.html            # 页面结构（打卡 / 回顾 / 词典）
├── manifest.json         # PWA 清单
├── sw.js                 # Service Worker（离线缓存）
├── css/style.css         # 样式
├── js/data.js            # 心所数据（51 心所释义 + 11 对照 + 15 独立）
├── js/app.js             # 主逻辑
├── icons/                # 应用图标
├── .github/workflows/    # GitHub Actions 自动部署配置
├── test/                 # 自动化测试（Node）
└── README.md
```

## 测试
```bash
cd test
npm install jsdom       # 首次
node logic-test.js      # 评分与日评逻辑
node e2e-test.js        # 端到端（渲染/打卡/保存/回顾/词典）
```
