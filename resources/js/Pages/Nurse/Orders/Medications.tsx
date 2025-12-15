import { Head } from "@inertiajs/react";
import HMSLayout from "@/Layouts/HMSLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Construction, Pill } from "lucide-react";

export default function NurseOrdersMedications() {
  return (
    <HMSLayout>
      <Head title="Medication Orders" />
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Medication Orders</h1>
          <p className="text-sm text-muted-foreground">
            Review physician orders and prepare administration rounds.
          </p>
        </div>

        <Card className="border-0 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Pill className="h-5 w-5 text-teal-600" />
              Coming Soon
            </CardTitle>
          </CardHeader>
          <CardContent className="py-10 text-center text-muted-foreground">
            <Construction className="mx-auto mb-4 h-12 w-12" />
            Medication order reconciliation is currently being wired up.
          </CardContent>
        </Card>
      </div>
    </HMSLayout>
  );
}
