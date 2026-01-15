资产管理系统 Frontend+BFF

# 这个系统是什么？（High-Level Overview）

一个用于聚合用户在不同资产平台持仓数据、统一计算资产收益、按分类和币种展示资产结构、并辅助用户做资产配置再平衡的智能资产管理系统。要求 mobile first, responsive design。
## 基础功能需求
- 源数据来自多个不同的broker，例如 东方财富证券，天天基金，雪球基金，盈透证券，嘉信理财
- 不同平台的数据在数据库中采用同一种数据结构存储
- 可以查看每个资产的收益
- 可以把不同币种的资产转换成目标币种
- 用户可以对资产分类，显示资产百分比，收益额，收益率，比如说 美股权益，中概股权益，亚太权益，其他权益类，商品，股息红利类，债券
- 用户可以选择某一种分类，然后设置不同分类的目标占比，系统会帮用户统计当前资产的偏离程度，可以查再平衡应该如何调仓，再平衡只针对分类，不针对具体资产
- 系统预设几种分类，用户可以根据自己的资产情况选择不同的分类。
- 用户也可以添加自定义分类
- 总资产走势图
- 收益率走势图

## 其他基础需求
  1.开始就需要支持中英文切换


## 基础前端页面
  1. Welcome
  2. Login
  3. Sign up
  4. Dashboard, 包含资产总额，日收益，年收益，收益率走势图，资产分类占比图
  5. Portfolio,包含资产总额，资产分类，资产分类下的所有持仓
  6. Analysis,风险收益分析或绩效指标页面。、
  7. reblance, 资产再平衡页面
  8. notification,消息通知中心
  9. Settings,主题设置，显示币种
## UI
位置 ：br\ui\designs
## 22. Visual Identity & Theming
 - Theme: Pure white theme (surface: #ffffff) with a minimalist, professional aesthetic.
 - Primary Color: Blue-600 (#2563EB) used for all primary actions and active states.
 - Typography: Using Inter for all display and body text to ensure modern readability.
 - Corner Radius: Standardized using Tailwind values (0.25rem for small elements, lg: 0.5rem for cards/buttons, xl: 0.75rem for larger containers).

## follow the ui designs if existed in br/ui/designs
 - If there are ui designs, the system MUST follow them as closely as possible.
 - Any deviation from the designs MUST be justified in the pull request.


# 系统架构
 - Web App
- BFF -Serverless
      

## 核心设计原则
- BFF 是唯一对前端暴露的 API 边界
- 数据库是状态与结果的唯一权威来源


