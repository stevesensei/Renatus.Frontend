# Renatus.Front

Vue 3 + TypeScript + Vite 的独立 SPA，使用 pnpm 11.7.0、PrimeVue 4.5.5（MIT）和 Aura 主题。Minecraft 皮肤与披风使用 skin3d 0.2.0 渲染。业务页面通过 REST API 访问 Renatus.Host，不使用 SSR。

## 开发

推荐 Node.js 24，安装 pnpm 11.7.0：

```sh
npm install -g pnpm@11.7.0
pnpm install --frozen-lockfile
pnpm dev
```

开发地址 http://localhost:5173。Vite 将 `/api` 代理到 http://localhost:5294，可在 `.env.local` 设置 `RENATUS_API_TARGET`。这是开发服务器配置，不是浏览器密钥。后端需要有效的 appsettings.json、PostgreSQL 和 Redis。

```sh
pnpm typecheck
pnpm lint
pnpm build
```

`pnpm build` 同时执行 Vue/TypeScript 类型检查，生成 `dist/`。`pnpm preview` 只提供静态产物，没有开发代理；完整联调应访问 Host。

## Host 构建与发布

在父项目根目录执行：

```sh
git submodule update --init --recursive
dotnet build Renatus.Host/Renatus.Host.csproj
dotnet run --no-build --project Renatus.Host
dotnet publish Renatus.Host/Renatus.Host.csproj -c Release -o publish
```

Host 构建在后端编译前执行冻结锁文件安装与前端构建，将 dist 复制到 wwwroot，并清理旧 assets。发布目录自动包含新生成的静态资源。浏览器访问 http://localhost:5294 即可；页面深链接由 Host 回退到 index.html，未知 `/api/*` 保持 404。已有构建产物可用 `-p:BuildFrontend=false` 跳过前端步骤。Dockerfile 使用独立 Node 构建阶段，运行镜像不需要 Node/pnpm。

## 页面与认证

`/` 是正式首页，保留 `/home` 别名，临时 `/index` 导航已移除。包含登录注册、控制台、账户、角色与设置、材质库/收藏/上传/详情，以及管理概览、用户/角色/材质管理、站点设置、公告编辑。没有业务示例数据或假保存。

应用 Bearer JWT 保存在当前标签页的 sessionStorage；路由守卫恢复账户并检查 Admin 权限，后端负责最终鉴权。退出清除本地会话，不撤销已签发的 JWT。登录/注册使用一次性 RSA-OAEP/SHA-256 会话公钥；密码修改和管理员重置密码沿用现有 HTTPS 请求契约。生产访问必须使用 HTTPS。

API 客户端同时处理 GlobalResponse 业务码、401/403、模型验证 400 和网络错误。数值枚举在客户端边界转换，不能与 Yggdrasil 令牌混用。Markdown 通过 DOMPurify 净化；PNG 上传校验类型、尺寸并计算 SHA256，服务端继续执行最终验证。

## 子模块

父项目以 `Renatus.Front` 路径登记子模块，远程为 `git@github.com:stevesensei/Renatus.Frontend.git`。克隆时使用 `git clone --recurse-submodules`。更新前端后先在子仓库提交并推送，再在父仓库更新 gitlink；父仓库只记录子仓库提交 ID。

开发设计规则见 DESIGN.md。历史 Blazor 耦合分析与本次 API 清单见 MIGRATION_TEMP.md。没有执行全面视觉/无障碍验收，也没有向实际业务数据库执行破坏性联调。

## 页脚配置

管理员在 `/admin/site` 的“页脚信息”中填写版权信息（最多 500 字符）和 ICP 备案号（最多 80 字符），保存后所有页面的页脚同步显示。空值隐藏。字段为 `copyright`、`icpRegistrationNumber`，经站点管理 API 保存到现有 `AppConfigurations` 表的 Site JSON，并通过 `/api/site/config` 返回；无需数据库结构迁移。

## 简单本地化

前端固定使用简体中文。界面文案集中在 `src/locales/zh_CN.json`：`messages` 包含页面、导航、表单、提示、无障碍标签和 HTML 元信息；`primevue` 包含组件内置文案。站点配置、用户信息、公告正文、材质名称等 API 内容仍按原值展示。

组件及 TypeScript 模块通过统一函数读取资源，资源键受 TypeScript 检查：

```ts
import { t } from '../i18n';
t('common.cancel');
t('textures.pagination', { currentPage: 2, total: 5 });
```

带参数的句子在 JSON 中写为 `第 {currentPage} / {total} 页`。新增文案时先添加资源键，再调用 `t()`；不要把显示文字当作角色、来源等业务值。材质来源使用 `original`/`repost` 内部标识，调用 API 时仍转换成原来的数值枚举。HTML 标题、描述和禁用 JavaScript 提示由 Vite 从同一份资源生成。
