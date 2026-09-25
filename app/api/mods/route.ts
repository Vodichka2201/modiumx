import { NextRequest, NextResponse } from "next/server";

type ModSearchResult = {
  id: string;
  source: "modrinth" | "curseforge";
  title: string;
  slug: string | null;
  author: string;
  description: string;
  icon_url: string | null;
  downloads: number;
  project_url: string;
};

type ModrinthSearchResponse = {
  hits: {
    project_id: string;
    slug: string | null;
    title: string;
    author: string;
    description: string;
    icon_url: string;
    downloads: number;
  }[];
  total_hits: number;
};

const MODRINTH_API = "https://api.modrinth.com/v2";

async function searchModrinth(
  query: string
): Promise<ModSearchResult[]> {
  const url = new URL(`${MODRINTH_API}/search`);

  url.searchParams.set("query", query);
  url.searchParams.set("limit", "20");
  url.searchParams.set("index", "relevance");

  url.searchParams.set(
    "facets",
    '[["project_type:mod"]]'
  );

  const response = await fetch(url.toString(), {
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    throw new Error("Modrinth API error");
  }

  const data =
    (await response.json()) as ModrinthSearchResponse;

  return data.hits.map((mod) => ({
    id: mod.project_id,
    project_id: mod.project_id,
    source: "modrinth",
    title: mod.title,
    slug: mod.slug,
    author: mod.author,
    description: mod.description,
    icon_url: mod.icon_url ?? null,
    downloads: mod.downloads,
    project_url: `https://modrinth.com/mod/${
      mod.slug ?? mod.project_id
    }`,
  }));
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();

  if (!query) {
    return NextResponse.json({
      results: [],
      total: 0,
    });
  }

  try {
    const results = await searchModrinth(query);

    return NextResponse.json({
      results,
      total: results.length,
    });
  } catch (error) {
    console.error("Mod search error:", error);

    return NextResponse.json(
      {
        error: "Failed to search mods",
      },
      { status: 500 }
    );
  }
}