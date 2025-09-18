import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Header from "@/components/header";

export default function AdminPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-body">
      <Header />
      <main className="flex-1 p-4 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle>Admin Dashboard</CardTitle>
            <CardDescription>
              Welcome to the admin dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>This is where you can manage your application.</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
