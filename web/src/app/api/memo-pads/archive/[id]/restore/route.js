import sql from "@/app/api/utils/sql";

// POST /api/memo-pads/archive/[id]/restore - Restore a memo pad from archive
export async function POST(request, { params }) {
  try {
    const { id } = params;

    const [restoredMemoPad] = await sql`
      UPDATE memo_pads 
      SET deleted_at = NULL, updated_at = NOW()
      WHERE id = ${id} AND deleted_at IS NOT NULL
      RETURNING id, title, content, created_at, updated_at
    `;

    if (!restoredMemoPad) {
      return Response.json(
        { success: false, error: 'Archived memo pad not found' },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      data: restoredMemoPad,
      message: 'Memo pad restored successfully'
    });
  } catch (error) {
    console.error('Error restoring memo pad:', error);
    return Response.json(
      { success: false, error: 'Failed to restore memo pad' },
      { status: 500 }
    );
  }
}