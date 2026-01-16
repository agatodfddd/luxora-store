import { redirect } from "next/navigation";

export default function Control() {
  // رابط سري للوصول لصفحة تسجيل دخول الأدمن
  redirect("/admin/login");
}
