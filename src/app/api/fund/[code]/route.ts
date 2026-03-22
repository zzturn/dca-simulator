import { NextRequest, NextResponse } from "next/server";
import { fundApi } from "@/lib/fund-api";

// 启用 ISR，1小时重新验证
export const revalidate = 3600;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    if (!code || !/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { error: "请输入有效的6位基金代码" },
        { status: 400 }
      );
    }

    const fundInfo = await fundApi.getFundInfo(code);
    return NextResponse.json(fundInfo, {
      headers: {
        // 浏览器缓存1小时，CDN可缓存24小时（过期后后台重新验证）
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("获取基金信息失败:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "获取基金信息失败" },
      { status: 500 }
    );
  }
}
