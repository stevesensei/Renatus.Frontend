# Blazor → 独立 SPA 迁移记录（临时）

## 当前实现（2026-10-13）

Blazor Pages 已由用户移除，共享 DTO/实体位于 Renatus.Data。Vue + TypeScript + PrimeVue 4 Aura SPA 已接入同源 REST API，保留 skin3d。临时导航首页与业务示例已移除，/ 为正式首页。Host 在编译前用 pnpm 构建并复制 dist 到 wwwroot，构建和 publish 包含静态资源，未知 API 不回退到页面。Dockerfile 具有独立前端构建阶段。

新增或扩展接口：

| 方法与路径 | 权限和用途 |
| --- | --- |
| GET /api/account | Bearer，账户资料与头像 |
| PUT /api/account | Bearer，更新昵称、邮箱、头像 |
| PUT /api/account/password | Bearer，校验当前密码后改密 |
| GET /api/texture/{id} | 公共详情或已登录上传者自己的私人详情 |
| GET /api/texture/public?search=&type= | 原公共分页接口增加名称/作者和类型筛选 |
| GET、PUT /api/admin/site | Admin，读取和保存站点设置及按钮 |
| GET、PUT /api/admin/announcements/{login或site} | Admin，读取和保存两个固定公告 |
| GET /api/site/config | 新增 apiBaseUrl 公开字段 |

应用 JWT 与 Yggdrasil RS256 令牌保持独立。SPA 本地退出不会撤销已签发的 JWT；管理员会话撤销仍只影响 Yggdrasil。头像/PNG/密码、枚举、清除材质绑定等保持原 API 语义。MVC record 请求校验已改为构造参数属性，以避免资料、角色、材质、站点编辑提交时出现元数据异常。

前端远程：git@github.com:stevesensei/Renatus.Frontend.git；父仓库以 Renatus.Front 为子模块路径。正式启动与发布命令见 README.md。

## 初始耦合评估归档

下文仅记录迁移前状态，依据 git 提交 6c00535 的 Blazor 页面及当时 Controller/Service。其中待办、拟议路径、旧 Cookie 流程和空 Git 仓库描述是历史评估，不能作为当前运行说明。

## 1. 本轮边界和结论

本轮创建独立 Vite SPA 骨架和 `.git/`，评估现有功能与 REST API 缺口。完整业务页移植、后端 API 补齐、删除 Blazor、提交及正式 submodule 登记留给后续步骤。

当前技术路线是 ASP.NET Razor Components + `InteractiveServer`（含默认预渲染），不是单纯静态 SSR：页面 C# 逻辑在服务器执行，依赖 Blazor circuit。目标是浏览器 SPA + REST，静态服务器提供 `dist/`，Host 只负责业务/API。

结论：所有业务页都绕过 HTTP 直接调用 Service；多数功能已有对应 Controller，因此无需重写业务层。阻塞迁移的主要缺口是账户资料/改密、材质详情、站点配置/公告保存，以及公共资源 URL 配置。MudBlazor 和 C# 页面逻辑不能直接作为 Vite 组件使用。

两种令牌必须分开：SPA 仅使用 `Auth:*` 签发的应用 Bearer JWT；Yggdrasil RS256 令牌仅用于 Minecraft 协议。即使前端预览复用 Yggdrasil PNG 地址，也不能拿协议令牌调用管理 API。

## 2. 页面和功能覆盖

以下列出全部 16 个 `@page` 路由。耦合等级以迁移依赖计：高为缺接口/服务器认证流程，中为已有 API 但需重写组件，低为纯客户端状态或错误显示。

| 页面源码（`Components/Pages/`）及路由 | 现有功能及直接依赖 | 可复用 HTTP 接口 | 耦合及待办 |
| --- | --- | --- | --- |
| `Home.razor` `/` | 站点文案、最多 3 个按钮、登录态 CTA；`SiteService` / `AuthorizeView` | `GET /api/site/config` | 中；前端登录态替代 Cookie；背景当前硬编码 `/background.jpg`，配置 `heroImage` 已返回但页面未使用 |
| `Login.razor` `/login` | 登录/注册切换、验证码、登录公告、returnUrl；`AuthService`、`PendingAuthStore`、RSA | `POST /api/auth/{session-key,login,register,register-code}`；`GET /api/site/config` | 高；浏览器密码加密；删除登录暂存与 `/account/signin` 跳转流程，接收 JWT 后更新前端状态 |
| `Dashboard.razor` `/dashboard` | 自有材质数量、公开/私有数量、Markdown 公告；`TextureService` / `SiteService` | `GET /api/texture`；`GET /api/site/config` | 中；现有列表可计算统计，不强制增加 dashboard 聚合 API |
| `AccountSettings.razor` `/account` | 资料读取、昵称/邮箱、上传/清除头像、验证旧密码后改密；`AuthService` | `GET /api/auth/me` 仅覆盖基础身份，不含头像 | 高；新增账户读写、改密接口；保存后更新布局状态，不再 forceLoad |
| `Players.razor` `/players` | 角色列表/额度、创建、删除确认、进入设置；`PlayerService` | `GET/POST /api/player`；`DELETE /api/player/{id}` | 中；额度由响应 `maxPlayerCount` 获取；重写弹窗/消息提示 |
| `PlayerSettings.razor` `/players/{id}/settings` | 读取角色，合并自有及收藏材质并按 ID 去重，选皮肤/披风、模型、清除绑定；`PlayerService` / `TextureService` / `TextureLibraryService` / `AppConfigurationService` | `GET /api/player/{id}`、`GET /api/texture`、`GET /api/texture/favorite`、`PUT /api/player/{id}/textures` | 高；前三个接口已齐；公共预览基址未在 SiteConfigDto 暴露；null 表示清除绑定 |
| `TextureLibrary.razor` `/textures` | 匿名分页、上传者、收藏/取消收藏、前后视图预览；`TextureLibraryService` / 配置 / JSInterop | `GET /api/texture/public?page=&pageSize=`；`POST /api/texture/favorite`；`DELETE /api/texture/favorite/{id}` | 高；补预览 URL 配置；登录用户访问匿名接口仍需附 Bearer 才有个性化收藏状态 |
| `TextureUpload.razor` `/textures/upload` | PNG 校验、名称/来源/说明/公开性、默认/细手臂、上传预览及动画；`TextureService` / `InputFile` / JSInterop | `POST /api/texture` | 中；改用浏览器 File API；现有 JSON base64 上传可复用，暂不需要 multipart API |
| `SkinPreview.razor` `/texture/preview?id=` | 公共材质详情、Markdown、文件信息、收藏、3D 动画/旋转；无有效 id 时 demo | 收藏 API 已有；PNG 地址已有 | 高；`TextureLibraryService.GetPublicPreviewAsync` 没有 Controller 对应 GET；返回 TexturePreviewDto 才能恢复详情 |
| `AdminOverview.razor` `/admin` | 用户/角色/材质总数、Yggdrasil 客户端数和最近活动 | `GET /api/admin/overview` | 中；已有聚合接口；客户端数不等同于在线用户数 |
| `AdminUsers.razor` `/admin/users` | 分页/搜索/角色/禁用筛选、详情、编辑、重置密码、撤销游戏会话、删除 | `/api/admin/users` 完整管理接口，见下节 | 中；管理员 JWT；原生交互重写；撤销只影响 Yggdrasil 客户端 |
| `AdminPlayers.razor` `/admin/players` | 分页、ownerId/搜索、编辑归属/名称/绑定/模型、删除 | `/api/admin/players` 完整管理接口 | 中；保留 ownerId 查询参数和 clearSkinTexture/clearCapeTexture 语义 |
| `AdminTextures.razor` `/admin/textures` | 分页、公开性/类型/uploaderId/sha256 筛选、编辑元数据、删除 | `/api/admin/textures` 完整管理接口 | 中；列表/详情/写入均已齐，不必新增；URL 参数名称需保持一致 |
| `AdminSiteSettings.razor` `/admin/site` | 标题/描述/heroImage/publicBaseUrl/最多 3 个按钮；`AppConfigurationService` | 公共 `GET /api/site/config` 只提供展示 DTO | 高；缺管理读写接口，公共 DTO 丢失 publicBaseUrl 且过滤空按钮 |
| `AdminAnnouncements.razor` `/admin/announcements` | 两个固定公告（login/site）、各自标题/正文/图片、Markdown 预览；`AppConfigurationService` | 公共配置已含两公告 | 高；缺公告保存接口；这是两个固定资源，不是公告列表 CRUD 系统 |
| `Error.razor` `/Error` | SSR 请求错误页、请求标识 | 无业务 API | 低；SPA 实现加载失败、未授权、404 和全局错误展示；请求追踪按实际 API 支持处理 |

## 3. 跨页面耦合

- **认证及权限**：`Program.cs` 默认认证方案为 Cookie；各前端 Controller 已显式要求 JWT Bearer，管理员还要求 `Admin`。`FrontendUserContext` 从 Blazor AuthenticationStateProvider 取得用户 ID。SPA 改用 token + `/api/auth/me` + 账户资料接口恢复状态；后端从 claims 取本人 ID，不能信任前端提交的 userId。路由守卫只控制 UI，实际权限仍由 API 验证。
- **登录和退出**：`PendingAuthStore` 在服务器内存暂存 AuthResponse，`/account/signin` 写 Cookie，`/account/signout` 清 Cookie。SPA 不需要这些路径，也不需要为了本地退出新增 API；清除本地 token/缓存即可，但不会撤销已签发 JWT。
- **布局和组件**：`MainLayout` 直接查账户头像/昵称、依赖 Cookie claims、MudTheme、语言资源和菜单。`ProtectedRoute`、`RedirectToLogin`、EditForm/DataAnnotations、MudDialog、Snackbar、文件上传及 lifecycle 均需客户端实现。`Admin*EditDialog`、`PlayerEditorDialog` 本身主要组装 DTO，可沿用字段/交互意图。
- **密码加密**：当前 Login.razor 用服务器 RSA 加密 `{unixTs}.{password}`；迁移后在浏览器用 Web Crypto（SPKI PEM 公钥、RSA-OAEP/SHA-256、UTF-8、base64），每次登录/注册重新请求 session-key；Redis key 只消费一次，失败重试必须拿新 key。Web Crypto 需 HTTPS，localhost 开发例外。会话 TTL/时间戳校验继续由服务端处理。
- **注册限流**：`RegistrationCodeSender` 使用服务器级联 ClientIp，API 已直接使用 RemoteIpAddress。SPA 仅传 email，计时使用 expiresAt/resendAfterSeconds。反向代理后的真实 IP 必须由 Host 配置受信任 ForwardedHeaders，不能让客户端自报 IP 或无条件信任转发头。
- **静态资源**：`wwwroot/app.css`、`admin.css`、`.razor.css`、`background.jpg`、`skins/steve.png`、`locales/{zh-CN,en-US}.json` 可逐项迁移；Blazor scoped CSS 和 `.mud-*` 选择器依赖旧组件 DOM，不能只复制最终 styles.css。资源迁入 SPA 的 public/src，不再依赖 `_content/MudBlazor`、`_framework/blazor.web.js`。
- **3D 预览**：根目录 `Frontend/skin3d-interop.ts` 已是浏览器模块，依赖 `skin3d@0.2.0`，以 canvas/DOM 为入口，可移入前端源码后让 Vite 构建；移除 C# IJSRuntime 调用层。保留创建、切模型、披风、动画、旋转、ResizeObserver 和卸载 dispose；列表预览也要覆盖。硬编码 `/skins/steve.png` 需适配部署 base。不要同时复制旧压缩产物和维护另一份 TS 源码。
- **Markdown/本地化**：C# Markdig 和 LocalizationService 需浏览器等价实现；保留禁用原始 HTML/输出净化及安全链接规则。现有语言取 CultureInfo，用户 PreferredLanguage 尚未接通普通账户页，不应声称已支持用户语言偏好保存。
- **URL**：`Site.PublicBaseUrl` 经 `AppConfigurationService.GetYggdrasilOptionsAsync` 覆盖协议 publicBaseUrl、homepageUrl、registerUrl 和 skinDomains。分域部署需独立 frontendBaseUrl：纹理及协议端点继续指向 API 域，首页/注册指向 SPA 域。不能把既有 publicBaseUrl 直接换成仅提供静态页面的域。

## 4. 已有 REST API 清单

前缀和动词以 Controller 为准；下表均是当前已有接口。

| 模块/鉴权 | 方法与路径 |
| --- | --- |
| 站点 / 匿名 | `GET /api/site/config`（heroImage/title/description/loginAnnouncement/siteAnnouncement/buttons） |
| 认证 / 匿名 | `POST /api/auth/session-key`、`POST /api/auth/login`、`POST /api/auth/register`、`POST /api/auth/register-code` |
| 身份 / Bearer | `GET /api/auth/me`；`GET /api/auth/admin/ping`（Admin）、`GET /api/auth/player/ping`（Player），ping 不替代权限检查 |
| 角色 / Bearer | `GET/POST /api/player`、`GET/DELETE /api/player/{id}`、`PUT /api/player/{id}/textures` |
| 自有材质 / Bearer | `GET/POST /api/texture`、`DELETE /api/texture/{id}` |
| 材质库 | `GET /api/texture/public`（匿名，page/pageSize）；`GET/POST /api/texture/favorite`、`DELETE /api/texture/favorite/{id}`（Bearer） |
| PNG / 协议资源 | `GET /api/yggdrasil/textures/{id:N}.png`（匿名，原始图片，无 GlobalResponse）；已存在，不是业务详情 API |
| 管理概览 / Admin Bearer | `GET /api/admin/overview` |
| 管理用户 / Admin Bearer | `GET /api/admin/users`（page/pageSize/search/role/isDisabled）、`GET/PATCH /api/admin/users/{id}`、`POST /api/admin/users/{id}/password`、`POST /api/admin/users/{id}/sessions/revoke`、`DELETE /api/admin/users/{id}?confirm=true` |
| 管理角色 / Admin Bearer | `GET /api/admin/players`（page/pageSize/ownerId/search）、`GET/PATCH/DELETE /api/admin/players/{id}` |
| 管理材质 / Admin Bearer | `GET /api/admin/textures`（page/pageSize/isPublic/type/uploaderId/source/sha256）、`GET/PATCH/DELETE /api/admin/textures/{id}` |

## 5. 需要补充的 REST API / 契约（拟议）

P0 为保持现有页面功能必需；P1 为管理员原始编辑数据读取，可用公开配置拼装部分字段，但独立管理 DTO 更完整。以下为拟议路径，避免与现有接口混淆。

| 优先级 | 方法/拟议路径 | 鉴权 | 请求/响应及可复用服务 |
| --- | --- | --- | --- |
| P0 | `GET /api/account` | Bearer | `AccountProfileDto`（id/username/nickName/email/avatarBase64/role）；`AuthService.GetAccountProfileAsync`，补 `/auth/me` 不含头像的缺口 |
| P0 | `PUT /api/account` | Bearer | `UpdateAccountProfileRequest` → `AccountProfileDto`；`UpdateAccountProfileAsync`，按完整表单替换，avatarBase64=null 清除头像，userId 由 token 提取 |
| P0 | `PUT /api/account/password` | Bearer | 最小复用 `ChangePasswordRequest{currentPassword,newPassword}` → 空成功 envelope；`ChangePasswordAsync`，必须 HTTPS、校验旧密码、禁止记录密码；前端确认密码仅本地验证 |
| P0 | `GET /api/texture/{id:guid}` | 匿名；可选应用 Bearer | `TexturePreviewDto`（含 dataUrl/sizeBytes/descriptionMarkdown/uploader/isFavorited）；`TextureLibraryService.GetPublicPreviewAsync`；只查公共材质，null 转为业务错误 envelope，不能误开放私有材质 |
| P0 | `PUT /api/admin/site` | Admin Bearer | 新站点写入 DTO，title/description/heroImage/publicBaseUrl/buttons，响应管理 DTO；`UpdateSiteOptionsAsync`；后端限制最多 3 个按钮，校验长度、URL 协议、target/style，不能只依赖 Mud 控件校验 |
| P0 | `PUT /api/admin/announcements/{kind}` | Admin Bearer | kind 仅 login/site；`{title,body,image}` → 公告 DTO；映射 `UpdateLoginAnnouncementAsync` / `UpdateSiteAnnouncementAsync`；校验长度及图片 URL，kind 任意值须拒绝 |
| P1 | `GET /api/admin/site` | Admin Bearer | 原始站点管理 DTO（含 publicBaseUrl 及可编辑按钮），`GetSiteOptionsAsync`；不要返回整个 AppConfigurations 表或 Yggdrasil 私钥/SMTP 配置 |
| P1 | `GET /api/admin/announcements/{kind}` | Admin Bearer | 对应固定公告 DTO，`GetLoginAnnouncementAsync` / `GetSiteAnnouncementAsync`；公共配置已有展示数据，此 GET 用于一致的管理资源读写 |

必要的现有接口扩展：`GET /api/site/config` 增加公开的 `textureBaseUrl` 或 `apiBaseUrl`（从站点 API 公网地址生成）。当前材质库和角色设置从服务器配置读取地址，已有展示 DTO 未包含它；也可选择在材质 DTO 中返回明确的 previewUrl 来解决同一缺口，不必同时实施两套方案。公网地址不是密钥，不暴露内部连接串。

`publicBaseUrl` 继续承担 API 公网地址；分域部署另加 frontendBaseUrl 管理字段，并调整协议首页/注册元数据。若统一站点域名通过 `/api` 反代，则可暂用相同域名，无需强制新增配置字段。

改密加密的后续选择：上表的最小接口复用现有明文 Service DTO，密码通过 HTTPS 传输；它与登录/注册 RSA 契约不同。如果要统一应用层加密，应新建改密 HTTP DTO（sessionKeyId/encryptedCurrentPassword/encryptedNewPassword），一次消费会话私钥后解密两字段，再调用原 Service；不能对同一个 sessionKeyId 调用两次一次性消费方法。现有管理员重置密码 API 同样接收 newPassword，应同步评估。此决策不阻塞本轮骨架。

## 6. HTTP 契约及保留语义

- 业务成功/失败沿用 `GlobalResponse<T>`：code=10000/10001/10010。JSON 配置忽略 null，空成功可能只有 code/message，客户端不能假设总有 data。
- `AuthException` 等经 Controller 转成业务 envelope，通常 HTTP 200；但 JWT 认证失败/角色不足可返回 401/403，`[ApiController]` 的模型绑定/验证可返回 400 ProblemDetails，未捕获异常也不保证 envelope。客户端必须同时处理 HTTP 和业务 code，不能仅凭 200 判成功。
- 当前未配置 JsonStringEnumConverter：JSON 枚举按数值处理，DB 的字符串 enum conversion 不能当作 HTTP 契约。生成前端类型时以 DTO/实际 OpenAPI 为准；role 的 JSON 数值与 JWT role claim 的 Admin/Player 字符串不同。
- GUID 普通 API 接受 guid；PNG 必须 N 格式（32 位无连字符）。日期为 DateTimeOffset ISO 字符串，前端按用户本地时间显示。
- 上传继续 `{type,dataBase64,isPublic,skinModel,name,source,descriptionMarkdown}`，当前 UI PNG 原始文件上限 2 MiB、名称 80 字符、说明 4000 字符。皮肤为 64n×32n 或 64n×64n，披风为 64n×32n；服务端校验仍是最终边界。头像支持 PNG/JPEG/WebP data URL、1,500,000 字节上限，清除值为 null。
- 上传者的材质自动收藏，现有 Unfavorite 服务不会删除上传者自身材质的收藏关系；前端需使用服务返回的 isFavorited，不能一律本地强制置 false。
- `PUT /api/player/{id}/textures` 的 null 绑定会清除；管理员 PATCH 使用额外 clearSkinTexture/clearCapeTexture 区分保留和清除。普通页面没有角色改名功能，不应为此列入必补 API。
- 当前 JWT 没有刷新/撤销接口或服务端版本检查。管理员撤销 sessions 是 Yggdrasil 会话；ChangePasswordAsync 也只更新 BCrypt hash，不自动注销应用 JWT 或游戏会话。若需求为立即失效/长会话续期，需要单独设计，不能宣称现有 signout 或 sessions/revoke 已完成。

## 7. 可选优化（非现有功能移植阻塞）

- 自有材质分页/统计聚合、列表缩略图/PNG 缓存、multipart 上传、专用头像资源、个人语言偏好、JWT refresh/revoke 均可后续设计，不在必补清单中。
- 现有 PNG 路径属于 Minecraft 协议，不能因搬迁前端删除。原始 PNG 查询与公共详情权限不是同一语义；若新建前端 PNG 接口，要单独定义自有/公共权限。
- `/api/texture/public` 最大 pageSize=24，当前库可按分页加载；不必为每张图获取包含整份 base64 的详情 DTO，列表可继续用 PNG 预览。

## 8. 迁移顺序与验收

1. 补 P0 API/公开 URL 契约，明确前端与 API 公网地址；确定框架后建立 HTTP 客户端、业务 envelope 处理、认证和权限状态。
2. 迁首页/登录/注册验证码、资料与布局；验证匿名、登录、退出、过期 token、错误密码、无效验证码及头像清除。
3. 迁角色/材质库/上传/详情，移入 skin3d 源码和默认皮肤；验证创建额度、绑定/清除皮肤披风、收藏幂等及上传者收藏、匿名详情、私有详情拒绝、PNG 校验、动画/旋转、组件卸载释放。
4. 迁管理概览/用户/角色/材质和站点/公告；验证 Admin 权限、搜索分页、删除确认、会话撤销范围、配置保存后展示、Markdown 禁止原始 HTML。
5. 对所有原路由完成深链接刷新、移动端及语言资源检查；统一同源反代或正确 CORS，验证 WebGL 跨域图片 CORS、注册真实 IP 限流及 HTTPS。
6. 全部功能验收后，才移除 Host 的 RazorComponents/MudBlazor 注册、MapRazorComponents、Cookie 登录桥接、PendingAuthStore/FrontendUserContext 和仅服务 Blazor 的资源/构建脚本。保留 API、后台 Service 和 Yggdrasil PNG 端点；后端按 csproj 构建。

## 9. 本轮 Git 状态说明

`Renatus.Front` 是独立工作目录和空 Git 仓库，未提交/推送。父仓库尚未登记 `.gitmodules` 或 gitlink；直接在父仓库 `git add .` 不能完成空子仓库的登记。需要先在子仓库形成首个提交，并提供真实远程地址，再按 README 步骤添加 submodule。本文为临时迁移清单，正式任务拆分后可替换或归档。

## 10. 源码依据

- 页面/路由/渲染：`Renatus.Host/Components/Pages/*.razor`、`App.razor`、`Routes.razor`、`Layout/MainLayout.razor`、`Shared/*.razor`。
- HTTP 对照：`Renatus.Host/Controller/{Auth,Player,Texture,Site,Admin}Controller.cs`、`Controller/Yggdrasil/YggdrasilTextureController.cs`。
- 业务及现有 DTO：`Renatus.Host/Service/{Auth,Player,Texture,TextureLibrary,Site,AppConfiguration}Service.cs`、`Data/{Account,Auth,Player,Texture,Site,Admin}Dtos.cs`、`Data/GlobalResponse.cs`、`Data/Config/SiteOptions.cs`。
- 服务器耦合及可迁资源：`Renatus.Host/Program.cs`、`Frontend/Services/*.cs`、`wwwroot/*`；根目录 `Frontend/skin3d-interop.ts`、`package.json`。
