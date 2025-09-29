import sql from "@/app/api/utils/sql";

// GET /api/memo-pads/archive - Get archived memo pads
export async function GET(request) {
  try {
    const archivedMemoPads = await sql`
      SELECT id, title, content, created_at, updated_at, deleted_at
      FROM memo_pads 
      WHERE deleted_at IS NOT NULL
      ORDER BY deleted_at DESC
    `;

    return Response.json({
      success: true,
      data: archivedMemoPads,
    });
  } catch (error) {
    console.error("Error fetching archived memo pads:", error);
    return Response.json(
      { success: false, error: "Failed to fetch archived memo pads" },
      { status: 500 },
    );
  }
}

// DELETE /api/memo-pads/archive - Permanently delete all archived items
export async function DELETE(request) {
  try {
    // Delete all archived items regardless of age
    const deletedMemoPads = await sql`
      DELETE FROM memo_pads 
      WHERE deleted_at IS NOT NULL
      RETURNING id
    `;

    return Response.json({
      success: true,
      message: "Success", // Simplified success message
    });
  } catch (error) {
    console.error("Error permanently deleting archived memo pads:", error);
    return Response.json(
      { success: false, error: "Failed to permanently delete archived items" },
      { status: 500 },
    );
  }
}
