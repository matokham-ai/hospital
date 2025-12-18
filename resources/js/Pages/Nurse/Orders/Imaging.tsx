import { Head } from "@inertiajs/react";
import HMSLayout from "@/Layouts/HMSLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Construction, ImageIcon } from "lucide-react";

export default function NurseOrdersImaging() {
  return (
    <HMSLayout>
      <Head title="Imaging Orders" />
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Imaging Orders</h1>
          <p className="text-sm text-muted-foreground">
            Track patient imaging requests and reporting status.
          </p>
        </div>

        <Card className="border-0 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ImageIcon className="h-5 w-5 text-teal-600" />
              Coming Soon
            </CardTitle>
          </CardHeader>
          <CardContent className="py-10 text-center text-muted-foreground">
            <Construction className="mx-auto mb-4 h-12 w-12" />
            Imaging workflows are being finalised and will appear here shortly.
          </CardContent>
        </Card>
      </div>
    </HMSLayout>
  );
}
