// ./src/app/api/war/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { executeWarAnalysis } from '@/src/services/warExecuter';

interface IWarRequestPayload {
    logText?: string;
}

export async function POST(request: NextRequest) {
    try {
        // Строго типизируем входящий JSON для защиты компилятора от implicit any
        const body: IWarRequestPayload = await request.json();
        const fileContent = body?.logText;

        if (!fileContent || !fileContent.trim()) {
            return NextResponse.json(
                { message: 'Missing or empty logText in request body' },
                { status: 400 },
            );
        }

        // Запуск MPA-анализатора по тексту лога
        const analyzedData = await executeWarAnalysis(fileContent);

        return NextResponse.json(
            {
                message: 'Analysis completed',
                data: analyzedData,
            },
            { status: 200 },
        );
    } catch (error) {
        console.error('Error handling War JSON request:', error);
        return NextResponse.json(
            { message: 'Error processing War request' },
            { status: 500 },
        );
    }
}
