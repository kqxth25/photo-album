# 共享相册 设计系统文档

## 一、设计理念

整体采用 **Dark Glass（深色玻璃拟态）** 设计语言。核心原则：

- **内容优先**：照片永远是最高的视觉层级，UI 不喧宾夺主
- **克制克制**：不使用高饱和颜色、复杂纹饰或夸张动画
- **空间组织**：通过留白和透明度构建层级，而非密集的分割线
- **自然物理**：所有动画基于 Spring 物理模型，拒绝机械 CSS ease
- **桌面质感**：参考 Apple Photos、Arc Browser、Linear、Raycast

---

## 二、配色

### 2.1 页面层级

| 层级 | 色值 | 用途 |
|------|------|------|
| 壁纸背景 | 用户自定义图片 | 固定全屏 cover，brightness(75%) |
| 暗角 | radial-gradient 中心透明 → 边缘 `rgba(0,0,0,0.4)` | 营造景深 |
| 磨砂玻璃层 | `rgba(35,35,35,0.48)` + blur(24px) | 全局覆盖，降低背景干扰 |
| 噪点纹 | SVG feTurbulence，opacity 0.035 | 消除塑料感 |

### 2.2 品牌色

| 角色 | 色值 | 用途 |
|------|------|------|
| 品牌蓝 | `#7EA9FF` | CTA、激活态、Hover 高亮 |
| 成功绿 | `#34D16E` | Hover 光环 |
| 危险红 | `#FF6A6A` | 删除、退出 |
| 警告橙 | `#FFB84D` | 状态提醒 |

品牌色使用规则：**仅用于 CTA、Hover、Active 和状态反馈**，不作为大面积装饰。

### 2.3 文字颜色（四级层级）

| 层级 | 色值 | 场景 |
|------|------|------|
| 一级 | `#FFFFFF` | 页面标题、激活导航 |
| 二级 | `#ECECEC` | 正文、卡片标题 |
| 三级 | `#B8B8B8` | 辅助说明、导航栏文字 |
| 禁用 | `#666666` | 时间戳、占位符、禁用态 |

---

## 三、字体

字体栈：`"PingFang SC", "HarmonyOS Sans", "MiSans", "SF Pro Display"`

### 3.1 字号层级

| 角色 | 大小 | 粗细 | 场景 |
|------|------|------|------|
| H1 | 24px | 700 | 页面标题（较少使用） |
| H2 | 18px (text-lg) | 600 | 模块标题（评论标题） |
| H3 | 15px | 600 | 卡片标题（详情页照片名） |
| Body | 14px (text-sm) | 400-500 | 正文、按钮 |
| Caption | 12px (text-xs) | 400 | 说明文字、底部栏 |
| Small | 10-11px | 400 | 辅助信息、标签、时间戳 |

原则：**使用粗细和透明度建立层级，不依赖过大的字号差异**。

---

## 四、间距与留白

基础单位：**8pt Grid System**

| 用途 | 间距 |
|------|------|
| 页面水平边距 | 20px (px-5) |
| 页面垂直边距 | 32px (py-8) |
| 卡片间距 | 16-24px (gap-4 ~ gap-6) |
| 模块间距 | 32px (mb-8) |
| 卡片内边距 | 16-24px (p-4 ~ p-6) |
| 元素间距（按钮间） | 8-12px (gap-2 ~ gap-3) |
| 标题→内容 | 16px |
| 页底部呼吸空间 | 大量留白，无 footer |

---

## 五、组件样式

### 5.1 导航栏 (Header)

```
background: rgba(30,30,30,0.55)
backdrop-filter: blur(20px)
border-bottom: 1px solid rgba(255,255,255,0.08)
box-shadow: 0 4px 24px rgba(0,0,0,0.3)
```

- 固定顶部 (sticky top-0)
- 高度 48-56px
- 毛玻璃半透明，让背景可感知

### 5.2 按钮

主 CTA 按钮：
```
background: #7EA9FF
color: #FFFFFF
border-radius: 999px (胶囊)
height: 44px (h-11)
padding: 0 20px
box-shadow: 0 6px 20px rgba(0,0,0,0.35)
```

次要按钮 / 导航项：
```
background: rgba(255,255,255,0.08)
color: #B8B8B8
border-radius: 999px
height: 36px (h-9) 或 32px (h-8)
Hover: background 轻微亮起
Active: scale(0.95) — spring 反馈
```

### 5.3 玻璃卡片

照片卡片 / 上传表单面板：
```
background: rgba(60,60,60,0.85)
backdrop-filter: blur(20px)
border: 1px solid rgba(255,255,255,0.08)
border-radius: 24px (rounded-3xl)
box-shadow: 0 10px 40px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.3)
```

悬浮时加浮起感和动态玻璃高光。

### 5.4 输入框

```
background: rgba(255,255,255,0.05)
border: 1px solid rgba(255,255,255,0.08)
border-radius: 999px (胶囊)
height: 44px (h-11)
Focus: box-shadow 品牌蓝光圈 2px
placeholder: #666666
```

### 5.5 标签 (Tag Chips)

```
background: rgba(255,255,255,0.08)
color: #B8B8B8
border-radius: 999px
font-size: 12px (text-xs)
Active: background #7EA9FF, color #FFFFFF
```

### 5.6 分段导航 (Segmented Control)

```
background: rgba(60,60,60,0.6)
backdrop-filter: blur(16px)
border: 1px solid rgba(255,255,255,0.08)
border-radius: 999px
box-shadow: 0 4px 20px rgba(0,0,0,0.3)
```

活跃指示器：`background rgba(255,255,255,0.1)` + 滑动 spring 动画（0.28s cubic-bezier 弹性曲线）

### 5.7 光标 (Cursor)

桌面端自定义 Glass Cursor：
- 内层：7px 纯白圆点 `#ffffff`
- 外层：22px 玻璃圆环 `border: 1.5px solid rgba(255,255,255,0.25)`
- 背景：`rgba(255,255,255,0.04)` + 微蓝辉光
- 跟随：Spring Motion，~30ms 惯性延迟
- 悬停：外环放大 18% + 辉光增强
- 点击：外环缩小 + 淡蓝 Ripple 波纹
- 触屏：自动隐藏，恢复系统光标

---

## 六、布局

### 6.1 首页布局

```
┌─────────────────────────────┐
│   Glass Header (固定顶部)     │
│   [📁 相册] [♡ 收藏] (胶囊)   │
│   [搜索框] [标签栏]           │
├─────────────────────────────┤
│   拖拽上传区域               │
│   (或 上传表单玻璃卡)        │
├─────────────────────────────┤
│   照片 Grid (flex-wrap)     │
│   2列(手机) / 3列(桌面)     │
│   照片卡片 + 3D Tilt        │
├─────────────────────────────┤
│   翻页栏 (页面底部)          │
└─────────────────────────────┘
```

### 6.2 详情页布局

```
┌─────────────────────────────┐
│   ← 返回    名称+标签    下载 删 │
├─────────────────────────────┤
│                             │
│        照片 (contain)       │
│      (flex-1 填充剩余空间)   │
│                             │
│              ← 导航箭头 →    │
├─────────────────────────────┤
│      描述   💬 评论 N   ♡ 收藏 │
└─────────────────────────────┘
```

桌面端和手机端使用同一套 flexbox 布局：
- 容器：`display: flex; flex-direction: column; height: 100dvh`
- 顶部栏：`flex-shrink: 0`
- 照片：`flex: 1; min-height: 0`（自动填充剩余空间）
- 底部栏：`flex-shrink: 0`
- 手机优先使用 `100dvh`（动态视口，适配 Safari 工具栏）

### 6.3 评论区

- 未打开：隐藏，右下角弹出动画（scale + opacity spring）
- 打开后：右下角浮窗玻璃卡片（w-72，约 288px），悬浮在照片之上
- 点击外部自动关闭
- 新评论自动滚到底部

### 6.4 层级架构

```
Z-Index 层次:
 0   — 壁纸背景
 1   — 磨砂玻璃层
 2   — 噪点纹
 10  — UI 内容层
 20  — 固定底部栏 / 评论区浮窗
 100 — 登录弹窗
 99997-99999 — 自定义光标
```

---

## 七、动画

### 7.1 Spring 物理

统一使用自定义 Spring Hook（`useSpring`），替换所有 CSS transition：

| 场景 | stiffness | damping | 效果 |
|------|-----------|---------|------|
| 卡片 Tilt 回弹 | 0.06 | 0.8 | 柔和归中 |
| 按钮 Hover | 0.25 | 0.8 | 快速响应 |
| 视差滚动 | 0.1 | 0.7 | 缓慢跟随 |
| 光标跟随 | 0.16 | 0.7 | 30ms 惯性 |
| 入场动画 | 0.08 | 0.7 | 渐进呈现 |

### 7.2 3D 卡片 Tilt

- 鼠标驱动 rotateX/rotateY ±6°
- perspective: 800px
- 玻璃高光 radial-gradient 跟随光标
- Mouse Leave → Spring 自然回中
- 入场：组合动画 opacity + translateY(20→0) + scale(0.95→1) + blur(4px→0)

### 7.3 视差

- 详情页照片：鼠标 ±8px 平移跟随
- 壁纸背景：固定 background-attachment
- 所有视差使用 Spring + RAF，60FPS

### 7.4 性能

- 仅操作 `transform` 和 `opacity`
- 零触发 layout/paint
- `requestAnimationFrame` 驱动
- `IntersectionObserver` 入场动画
- 触屏设备自动禁用光标动画

---

## 八、认证 UI

- 登录/注册：玻璃模态框（rounded-3xl, blur(24px), shadow）
- 输入框：胶囊式，半透明背景，focus 品牌蓝光圈
- 按钮：品牌蓝胶囊，全宽
- 错误提示：红色文字（#FF6A6A），12px
- 注册验证：两次密码一致性检查，密码≥6位，用户名≥2字符
- 登录后：用户名显示在导航栏，退出按钮半透明次要样式

---

## 九、响应式

| 断点 | 列数 | 特殊规则 |
|------|------|----------|
| < 640px (手机) | 2 列 | 隐藏搜索/标签（收藏视图）、光标自动禁用 |
| 640-1024px (平板) | 2-3 列 | 磨砂模糊 16px（中等） |
| > 1024px (桌面) | 3 列 | 磨砂模糊 24px（最强）、自定义光标启用 |

---

## 十、文件组织

```
src/
├── app/
│   ├── layout.tsx          # 四层背景结构
│   ├── page.tsx            # 首页：网格 + 上传 + 翻页 + 认证
│   ├── globals.css         # 全局变量、动画、玻璃层
│   ├── photo/[id]/page.tsx # 详情页：大图 + 评论 + 收藏
│   └── api/               # API 路由
├── components/
│   ├── PhotoCard.tsx       # 动画照片卡片（Tilt + Entry）
│   ├── DinoCursor.tsx      # Glass 自定义光标
│   ├── AuthModal.tsx       # 登录/注册玻璃模态框
│   ├── SegmentedControl.tsx# 胶囊式分段导航
│   └── ClientWrapper.tsx   # AuthContext 客户端包裹
├── hooks/
│   ├── useSpring.ts        # Spring 物理引擎
│   ├── useTilt.ts          # 3D 透视 Tilt + 高光
│   ├── useParallax.ts      # 视差滚动
│   ├── useInView.ts        # 入场动画触发器
│   └── useFavorites.ts     # 收藏状态管理
├── lib/
│   ├── db.ts               # Supabase CRUD
│   ├── upload.ts           # 文件上传处理
│   ├── supabase.ts         # Supabase 客户端
│   └── AuthContext.tsx      # 认证上下文
└── public/
    └── wallpaper/           # 壁纸图片
```

---

*最后更新：2026-06-25*
