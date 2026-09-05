import { NextResponse } from "next/server";

type ModrinthGameVersion = {
  version: string;
  version_type: "release" | "snapshot" | "alpha" | "beta";
};

export async function GET() {
  try {
    const response = await fetch(
      "https://api.modrinth.com/v2/tag/game_version",
      {
        next: {
          revalidate: 3600,
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch Minecraft versions" },
        { status: response.status }
      );
    }

    const versions =
      (await response.json()) as ModrinthGameVersion[];

    const releaseVersions = versions
      .filter((version) => version.version_type === "release")
      .map((version) => version.version);

    return NextResponse.json({
      versions: releaseVersions,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to connect to Modrinth" },
      { status: 500 }
    );
  }
}