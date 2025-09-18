import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

export default function ModelManagementPage() {
  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Model Management</h2>
                <p className="text-muted-foreground">
                    Manage your 3D models here.
                </p>
            </div>
            <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Model
            </Button>
        </div>
        <Card>
            <CardHeader>
                <CardTitle>Your Models</CardTitle>
                <CardDescription>
                A list of your uploaded 3D models.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                    <p className="text-muted-foreground">No models uploaded yet.</p>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
