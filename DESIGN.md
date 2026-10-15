# Renatus / Aura 设计系统

## 1. 氛围与定位
保留现有 Renatus 的紫色身份、Minecraft 背景、首页/登录双栏、材质卡片和管理表格结构。用 PrimeVue Aura 组件替换 MudBlazor；这是既有页面移植，视觉参考为原项目及 Aura，不进行另一个品牌的重新设计。页面通过同源 REST API 加载真实数据，管理员菜单及路由仅对 Admin 显示。

## 2. 色彩
组件使用 Aura semantic token；primary 使用紫色梯度，500=#5B4BE7，600=#4C3BCD，700=#3F2FB0。页面 token：canvas=#F4F6F8，surface=#FFFFFF，ink=#172033，muted=#667085，line=#E4E7EC，soft=#EEEAFE，secondary=#00A6A6。深色：canvas=#11131C，surface=#1B1E2A，ink=#F3F4F8，muted=#ADB4C5，line=#303545，soft=#29243F。状态色由 Aura success/warn/danger 负责。hero 使用黑色透明渐变增强文字对比。skin stage 使用淡紫/浅蓝径向背景和棋盘地面，深色对应暗紫表面。

## 3. 字体
系统字体 Inter/system-ui/PingFang SC/Microsoft YaHei；无需远程字体。正文16px/1.6，辅助14px，标签12px；标题20/24/32/48px，首页展示字号clamp(40px,6vw,72px)，字重500/600/700。等宽仅用于 ID 和 hash。

## 4. 间距与布局
4px 基准，spacing=4/8/12/16/24/32/48/64px。圆角8/12/20px。全局内容宽1280px、skin-detail双栏(1.5fr/1fr)、表单双栏、材质网格3列。桌面管理侧栏232px；移动端导航折叠、表单单列、卡片1列；断点640/768/1024px。普通页面滚动归document，表格窄屏允许局部横向滚动，主页面不横向溢出。

## 5. 组件
- AppShell：品牌、顶栏、管理侧栏、主题开关、账户与退出入口；RouterLink有active/focus状态；移动端菜单Button展开。
- PageHeading：标题/说明/右侧动作；窄屏纵向。
- Panel：白色表面、边框、12px圆角、24px内边距；default/empty/error。
- MetricCard：数值、图标、说明；使用实际 API 汇总数据。
- Aura组件：Button、InputText、Password、Select、Dialog、DataTable、Tag、Toast、ToggleSwitch；沿用库的keyboard/focus/disabled/validation行为，所有输入有label。
- TextureCard：真实skin3d canvas、材质名/作者/状态、收藏按钮、详情链接；卡片本身不嵌套交互链接。
- SkinViewer：canvas+加载/错误状态，skin/cape/model输入；动画及旋转由父页面控制；ResizeObserver自适应，unmount dispose，列表静态渲染减少开销；无法使用WebGL时显示可读错误。
- MarkdownContent：marked解析+DOMPurify净化；拒绝脚本/危险链接，长内容自动换行。

## 6. 交互与动效
按钮/链接使用Aura交互反馈；页面无装饰入场动画。skin3d支持idle/walk/run/fly/wave/crouch/hit和旋转；prefers-reduced-motion初始静止。表单保存、上传、收藏和 CRUD 调用 API，成功后刷新数据；失败显示服务端消息，加载期间禁用重复提交。

## 7. 深度与表面
mixed：Panel边框，轻微阴影只用于材质卡片/菜单/弹窗；hero使用原有background.jpg。阴影=0 8px 28px rgba(23,32,51,.06)，stage-halo不替代真实canvas。

## 8. 可访问性与范围
目标AA：可见 focus、语义标题、表单 label、44px 触摸目标、图片 alt、canvas 文字说明、空/失败状态。所有原页面已迁移；首页为 /，/home 保留别名，临时索引已移除。未执行全面视觉或无障碍验收。

页脚使用站点配置中的 copyright 和 icpRegistrationNumber，空值隐藏；沿用现有文字样式和间距，长文本允许换行。

界面文案统一读取 src/locales/zh_CN.json，保持现有措辞与布局；动态句子使用参数占位符。当前语言固定为简体中文，PrimeVue 默认提示和无障碍标签也由该资源提供。API 业务内容保留原值。

## 邮箱验证、联盟角色与启动器配置
- 邮箱未验证时，已登录页面顶栏下显示 Aura Warning 和验证入口；验证/更换邮箱复用模态框，明确发送对象、发送验证码、重发等待、输入及提交状态，验证成功后移除提醒。弹窗使用现有 compact-dialog，错误就近展示。
- 联盟角色页以用户提供的两张 Union 截图为信息结构参考：顶部绑定说明与注意事项、站点安全等级及 SL3/SL1/SL0 解释、每个角色的当前/绑定角色表、同名冲突表、绑定令牌操作。保留 Renatus 紫色 Aura、字体和 Panel 样式，不复制旧站的按钮颜色或过时 Bug 说明。
- 角色表显示有效映射名、所属皮肤站、原始及映射 UUID、当前/主/关联角色状态。UUID 使用等宽文字并允许断行；宽表仅在自身容器横向滚动，移动端页面不溢出。绑定和解绑的等待/失败/空状态均明确。全局 UUID 绑定不在本次界面提供。
- 启动器配置作为控制台下方的独立区块，包含可拖动的真实协议链接、复制公开 API 地址与教程入口。协议链接和拖动数据采用 authlib-injector:yggdrasil-server: 加 URL 编码地址；文字说明不包含账户凭据。
- 沿用已有键盘焦点、标签和对话框可访问性，无新增装饰动画。按用户要求仅做构建与关键交互简单检查，不做全面视觉性能验收。
