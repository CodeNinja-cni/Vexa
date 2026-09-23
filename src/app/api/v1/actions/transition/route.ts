export function POST() {
  return Response.json(
    {
      error: "deprecated_endpoint",
      message:
        "Use POST /api/v1/actions/{actionId}/transition. Persisted transitions require authentication and tenant ownership.",
    },
    { status: 410 },
  );
}
