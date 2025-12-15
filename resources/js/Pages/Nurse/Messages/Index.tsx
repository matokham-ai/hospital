import { Head } from "@inertiajs/react";
import HMSLayout from "@/Layouts/HMSLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Construction } from "lucide-react";

export default function MessagesIndex() {
  return (
    <HMSLayout>
      <Head title="Messages - Nurse Dashboard" />
      
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Team Messages</h1>
          <p className="text-muted-foreground">Communicate with your team</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Messages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <Construction className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
              <p className="text-muted-foreground">
                Messages module is under development
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </HMSLayout>
  );
}
