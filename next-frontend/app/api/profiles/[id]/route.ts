import { NextRequest, NextResponse } from "next/server"
import {createClient} from "@/lib/supabase/server"

type Params = { params: Promise<{ id: string }> };

export async function GET(
    req: NextRequest,
    ctx: Params
) {
    // ctx is a promise, so we have to await it
    const { id } = await ctx.params;
    const supabase = await createClient();

    const {data, error} = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single(); // one row
    
    if (error) { 
        return NextResponse.json(
            { error: { message: error.message, code: error.code }},
            { status: 500 }
        );
    }

    if (!data) {
        return NextResponse.json(
            { error: { message : "Profile not found"}},
            { status: 404}
        );
    }

    return NextResponse.json({data}, {status: 200})

}