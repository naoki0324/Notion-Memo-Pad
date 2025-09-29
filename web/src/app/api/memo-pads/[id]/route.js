import sql from "@/app/api/utils/sql";

// GET /api/memo-pads/[id] - Get a specific memo pad
export async function GET(request, { params }) {
  try {
    const { id } = params;

    const [memoPad] = await sql`
      SELECT id, title, content, created_at, updated_at 
      FROM memo_pads 
      WHERE id = ${id} AND deleted_at IS NULL
    `;

    if (!memoPad) {
      return Response.json(
        { success: false, error: "Memo pad not found" },
        { status: 404 },
      );
    }

    return Response.json({
      success: true,
      data: memoPad,
    });
  } catch (error) {
    console.error("Error fetching memo pad:", error);
    return Response.json(
      { success: false, error: "Failed to fetch memo pad" },
      { status: 500 },
    );
  }
}

// PUT /api/memo-pads/[id] - Update a memo pad
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { content } = body;

    if (content === undefined) {
      return Response.json(
        { success: false, error: "Content is required" },
        { status: 400 },
      );
    }

    // Extract first line as title
    const lines = content.split("\n");
    const title = lines[0]?.trim() || "Untitled";

    const [updatedMemoPad] = await sql`
      UPDATE memo_pads 
      SET title = ${title}, content = ${content}, updated_at = NOW()
      WHERE id = ${id} AND deleted_at IS NULL
      RETURNING id, title, content, created_at, updated_at
    `;

    if (!updatedMemoPad) {
      return Response.json(
        { success: false, error: "Memo pad not found" },
        { status: 404 },
      );
    }

    return Response.json({
      success: true,
      data: updatedMemoPad,
    });
  } catch (error) {
    console.error("Error updating memo pad:", error);
    return Response.json(
      { success: false, error: "Failed to update memo pad" },
      { status: 500 },
    );
  }
}

// DELETE /api/memo-pads/[id] - Soft delete a memo pad (move to archive)
export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    const [deletedMemoPad] = await sql`
      UPDATE memo_pads 
      SET deleted_at = NOW()
      WHERE id = ${id} AND deleted_at IS NULL
      RETURNING id
    `;

    if (!deletedMemoPad) {
      return Response.json(
        { success: false, error: "Memo pad not found" },
        { status: 404 },
      );
    }

    return Response.json({
      success: true,
      message: "Memo pad moved to archive",
    });
  } catch (error) {
    console.error("Error archiving memo pad:", error);
    return Response.json(
      { success: false, error: "Failed to archive memo pad" },
      { status: 500 },
    );
  }
}
