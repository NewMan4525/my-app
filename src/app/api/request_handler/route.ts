import { NextRequest, NextResponse } from "next/server";
import { executeGetData } from "@/src/lib/execute";
import { settings } from "@/src/lib/settings";
/**
 * Обрабатывает POST-запросы на данный Route Handler.
 * @param request Объект NextRequest, содержащий данные запроса.
 * @returns NextResponse с результатом обработки.
 */

export async function POST(request: NextRequest) {
  try {
    // Данные формы, отправленные через HTML-форму (application/x-www-form-urlencoded или multipart/form-data),
    // доступны через request.formData().
    const formData = await request.formData();
    const region = formData.get("region")?.toString() || "";
    settings.region = region;
    executeGetData();
    return NextResponse.json({ message: "Result:", region }, { status: 200 });
  } catch (error) {
    console.error("Error handling Orders request:", error);
    return NextResponse.json(
      { message: "Error processing Orders request" },
      { status: 500 },
    );
  }
}
