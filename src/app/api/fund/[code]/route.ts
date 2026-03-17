import { NextRequest, NextResponse } from "next/server";
import { fundApi } from "@/lib/fund-api";

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
    return NextResponse.json(fundInfo);
  } catch (error) {
    console.error("获取基金信息失败:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "获取基金信息失败" },
      { status: 500 }
    );
  }
}
