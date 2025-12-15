import { Head } from "@inertiajs/react";
import HMSLayout from "@/Layouts/HMSLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Construction } from "lucide-react";

export default function OrdersIndex() {
  return (
    <HMSLayout>
      <Head title="Orders - Nurse Dashboard" />
      
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Patient Orders</h1>
          <p className="text-muted-foreground">View and manage patient orders</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Orders Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <Construction className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
              <p className="text-muted-foreground">
                Orders module is under development
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </HMSLayout>
  );
}
