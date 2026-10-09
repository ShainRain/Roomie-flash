/**
 * assetUrl — 集中式静态资产路径解析（部署子路径安全）。
 *
 * 所有 /assets/、/audio/、/fonts/ 等根绝对路径必须经此函数加 BASE_URL 前缀：
 * - 本地 dev / 默认构建（base './'）：转为相对路径（hash 路由下文档恒为 index.html）✓
 * - GitHub Pages 子路径构建（base '/Roomie-flash/'）：转为 '/Roomie-flash/...' ✓
 * - 外部 URL（http/https/blob/data）与已是相对路径的原样返回。
 *
 * 注意：src/shared/room-scene-layout.js 是生成文件（禁手改），其中的 /assets/ 路径
 * 由消费方（room-scene 渲染器等）统一经本函数解析，不改数据本身。
 */

const BASE = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL) || '/';

export function assetUrl(path) {
  if (!path) return '';
  if (!path.startsWith('/')) return path; // 相对路径 / 外部 URL 原样
  return BASE === '/' ? path : BASE.replace(/\/$/, '') + path;
}

export default assetUrl;
