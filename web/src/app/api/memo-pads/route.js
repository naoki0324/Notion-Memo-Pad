import sql from "@/app/api/utils/sql";

// GET /api/memo-pads - List all memo pads
export async function GET(request) {
  try {
    const memo_pads = await sql`
      SELECT id, title, content, created_at, updated_at 
      FROM memo_pads 
      WHERE deleted_at IS NULL
      ORDER BY updated_at DESC
    `;

    return Response.json({
      success: true,
      data: memo_pads,
    });
  } catch (error) {
    console.error("Error fetching memo pads:", error);
    return Response.json(
      { success: false, error: "Failed to fetch memo pads" },
      { status: 500 },
    );
  }
}

// POST /api/memo-pads - Create a new memo pad
export async function POST(request) {
  try {
    const body = await request.json();
    const { content = "" } = body;

    // Extract first line as title
    const lines = content.split("\n");
    const title = lines[0]?.trim() || "Untitled";

    const [newMemoPad] = await sql`
      INSERT INTO memo_pads (title, content, updated_at)
      VALUES (${title}, ${content}, NOW())
      RETURNING id, title, content, created_at, updated_at
    `;

    return Response.json({
      success: true,
      data: newMemoPad,
    });
  } catch (error) {
    console.error("Error creating memo pad:", error);
    return Response.json(
      { success: false, error: "Failed to create memo pad" },
      { status: 500 },
    );
  }
}
