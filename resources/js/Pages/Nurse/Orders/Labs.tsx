import { Head } from "@inertiajs/react";
import HMSLayout from "@/Layouts/HMSLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Construction, TestTube } from "lucide-react";

export default function NurseOrdersLabs() {
  return (
    <HMSLayout>
      <Head title="Lab Orders" />
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Laboratory Orders</h1>
          <p className="text-sm text-muted-foreground">
            Monitor pending and completed lab orders for your patients.
          </p>
        </div>

        <Card className="border-0 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TestTube className="h-5 w-5 text-teal-600" />
              Coming Soon
            </CardTitle>
          </CardHeader>
          <CardContent className="py-10 text-center text-muted-foreground">
            <Construction className="mx-auto mb-4 h-12 w-12" />
            Workflow integration for lab orders is under development.
          </CardContent>
        </Card>
      </div>
    </HMSLayout>
  );
}
