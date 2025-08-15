# Pic2PDF & PDF2Pic - 图片PDF互转工具

> 一个通过vibe coding构建的、功能强大（不是）的 Next.js 应用，可以轻松实现图片与 PDF 文件之间的相互转换。
> 全程 vibe coding 编写，建议小范围私有化部署。

[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

## 功能特性

### 🖼️ 图片转 PDF (Pic2PDF)
- 将多张图片合并为一个 PDF 文档
- 支持拖拽上传和重新排序图片
- 可自定义 PDF 页面尺寸、方向和边距
- 支持多种页面尺寸（A4、A3、A5、Letter）
- 自动根据图片比例调整页面方向
- 可对图片进行排序（按文件名、修改日期等）

### 📄 PDF 转图片 (PDF2Pic)
- 将 PDF 文件的每一页转换为高质量图片
- 支持选择转换特定页面或全部页面
- 可选择输出图片格式（PNG、JPEG、WEBP）
- 可调节输出图片分辨率（150 DPI、300 DPI、600 DPI）
- 将所有转换的图片打包为 ZIP 文件下载

## 技术栈

- **框架**: [Next.js 15](https://nextjs.org/)
- **语言**: TypeScript
- **样式**: Tailwind CSS + shadcn/ui
- **PDF 处理**: jspdf, pdfjs-dist
- **图片处理**: HTML5 Canvas
- **压缩**: JSZip
- **拖拽**: react-dnd
- **图标**: lucide-react

## 🚀 快速开始

### 使用 Docker (推荐)

只需一行命令即可启动应用：

```bash
# 需有科学上网环境
docker compose up -d
```

应用将在 http://localhost:3000 运行

### 本地开发

#### 前置要求

- Node.js 18 或更高版本
- npm 或 yarn 包管理器

#### 安装

```bash
# 克隆项目
git clone <repository-url>

# 进入项目目录
cd pic_pdf

# 安装依赖
npm install
```

#### 开发

```bash
# 启动开发服务器
npm run dev
```

访问 http://localhost:9002 查看应用。

#### 构建和运行

```bash
# 构建生产版本
npm run build

# 启动生产服务器
npm run start
```

## 使用指南

### 图片转 PDF

1. 访问首页的 "Images to PDF Converter" 页面
2. 点击上传区域或拖拽图片文件
3. 通过拖拽图片卡片来重新排序
4. 在右侧设置面板中配置 PDF 参数：
   - 文件名
   - 页面尺寸
   - 页面方向（自动/纵向/横向）
   - 页面边距
   - 图片排序方式
5. 点击 "Convert to PDF" 按钮
6. 转换完成后点击 "Download" 下载 PDF

### PDF 转图片

1. 访问 "/pdf-to-images" 页面
2. 点击上传区域上传 PDF 文件
3. 使用预览功能查看 PDF 页面
4. 在右侧设置面板中配置转换参数：
   - 选择要转换的页面（全部或自定义）
   - 选择输出图片格式
   - 选择分辨率
5. 点击 "Convert to Images" 按钮
6. 转换完成后点击 "Download ZIP" 下载包含所有图片的压缩包

## 📁 项目结构

```
├── src/
│   ├── app/                    # Next.js 应用路由
│   │   ├── page.tsx            # 图片转 PDF 主页
│   │   ├── images-to-pdf-client.tsx  # 图片转 PDF 客户端组件
│   │   └── pdf-to-images/      # PDF 转图片功能模块
│   ├── components/             # React 组件
│   ├── hooks/                  # React 自定义 hooks
│   ├── lib/                    # 工具函数和库
│   └── ai/                     # AI 相关功能（Genkit）
├── Dockerfile                  # 生产环境 Docker 配置
├── Dockerfile.dev              # 开发环境 Docker 配置
├── docker-compose.yml          # Docker Compose 配置
├── next.config.ts              # Next.js 配置
└── package.json                # 项目依赖
```

## 🛠️ 可用脚本

```bash
npm run dev          # 启动开发服务器 (端口 9002)
npm run build        # 构建生产版本
npm run start        # 启动生产服务器 (端口 3000)
npm run lint         # 运行 ESLint 检查
npm run typecheck    # 运行 TypeScript 类型检查
```

## 🐳 Docker 部署

### Docker Compose (推荐)

```bash
# 启动服务
docker compose up -d

# 查看日志
docker compose logs -f

# 停止服务
docker compose down
```

### 手动 Docker 构建

```bash
# 构建镜像
docker build -t pic-pdf .

# 运行容器
docker run -d -p 3000:3000 --name pic-pdf-app pic-pdf
```

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请考虑给一个 Star！**

</div>