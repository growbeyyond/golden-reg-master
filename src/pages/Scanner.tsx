import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { QrCode, User, Phone, Mail, Clock, CheckCircle2, XCircle, Camera } from "lucide-react";

interface AttendeeInfo {
  name: string;
  email: string;
  phone: string;
  tier: string;
}

interface ScanResult {
  success: boolean;
  message?: string;
  error?: string;
  attendee?: AttendeeInfo;
  checkedInAt?: string;
}

const Scanner = () => {
  const [qrCode, setQrCode] = useState("");
  const [scanning, setScanning] = useState(false);
  const [lastResult, setLastResult] = useState<ScanResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scanTicket = useCallback(async (code: string) => {
    if (!code.trim()) {
      toast.error("Please enter a QR code");
      return;
    }

    setScanning(true);
    try {
      const { data, error } = await supabase.functions.invoke('scan-ticket', {
        body: { qrCode: code.trim() }
      });

      if (error) {
        console.error('Scan error:', error);
        toast.error("Failed to scan ticket");
        setLastResult({ success: false, error: "Scan failed" });
        return;
      }

      setLastResult(data);

      if (data.success) {
        toast.success(`Welcome ${data.attendee.name}! Check-in successful.`);
      } else {
        toast.error(data.error || "Invalid ticket");
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error("An unexpected error occurred");
      setLastResult({ success: false, error: "Unexpected error" });
    } finally {
      setScanning(false);
    }
  }, []);

  const handleScan = () => {
    scanTicket(qrCode);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleScan();
    }
  };

  const clearResults = () => {
    setLastResult(null);
    setQrCode("");
    inputRef.current?.focus();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <QrCode className="h-16 w-16 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Event Scanner</h1>
          <p className="text-muted-foreground">Scan QR codes to check in attendees</p>
        </div>

        {/* Scanner Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              QR Code Scanner
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                placeholder="Enter or scan QR code"
                value={qrCode}
                onChange={(e) => setQrCode(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button 
                onClick={handleScan} 
                disabled={scanning || !qrCode.trim()}
              >
                {scanning ? "Scanning..." : "Scan"}
              </Button>
            </div>
            
            {lastResult && (
              <div className="mt-4">
                <Button variant="outline" onClick={clearResults} className="mb-4">
                  Clear & Scan Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        {lastResult && (
          <Card className={lastResult.success ? "border-green-500" : "border-red-500"}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {lastResult.success ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                {lastResult.success ? "Check-in Successful" : "Check-in Failed"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {lastResult.success && lastResult.attendee ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">{lastResult.attendee.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{lastResult.attendee.tier}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{lastResult.attendee.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{lastResult.attendee.phone}</span>
                    </div>
                  </div>
                  {lastResult.checkedInAt && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t">
                      <Clock className="h-4 w-4" />
                      <span>Checked in at: {new Date(lastResult.checkedInAt).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-red-600 font-medium">
                  {lastResult.error || "Unknown error occurred"}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2 text-sm text-muted-foreground">
              <h3 className="font-semibold text-foreground mb-2">Instructions:</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>Enter the QR code text in the input field above</li>
                <li>Press Enter or click the Scan button to check in the attendee</li>
                <li>Each ticket can only be used once</li>
                <li>The system will show attendee details upon successful check-in</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Scanner;