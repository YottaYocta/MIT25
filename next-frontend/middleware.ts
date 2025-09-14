import { updateSession } from "@/lib/supabase/middleware";
import { type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * Feel free to modify this pattern to include more paths.
     */
    // exclude api routes from middleware
    // also exclude common 3D model and texture file types and public asset paths
    "/((?!api|_next/static|_next/image|favicon.ico|public/|models/|textures/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|gltf|glb|bin|ktx2|basis|hdr|exr)$).*)",
  ],
};
