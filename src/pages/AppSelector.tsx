
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ServerIcon, ShieldCheckIcon } from "lucide-react";
import { Link } from "react-router-dom";

const AppSelector = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-5xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-navy mb-2">
            Decentralized Fraud Detection
          </h1>
          <p className="text-lg text-slate-600">
            Federated Ensemble Learning & Expert Rule System
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Server */}
          <Card className="col-span-1 md:col-span-1 bg-navy text-white hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <ServerIcon className="h-6 w-6 text-blue-light" />
                <CardTitle>Server</CardTitle>
              </div>
              <CardDescription className="text-slate-300">
                Detection aggregator
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <ul className="space-y-1.5 text-sm text-slate-300">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-light"></span>
                    Client monitoring
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-light"></span>
                    Score aggregation
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-light"></span>
                    Expert rule fallback
                  </li>
                </ul>
                <Link
                  to="/server/dashboard"
                  className="w-full py-2 px-3 bg-blue text-white rounded-md text-center font-medium hover:bg-blue-dark transition-colors"
                >
                  Launch Server
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Clients */}
          {[1, 2, 3].map((clientId) => (
            <Card 
              key={clientId} 
              className="col-span-1 hover:shadow-lg transition-shadow border-blue-100"
            >
              <CardHeader>
                <div className="flex items-center gap-2.5">
                  <ShieldCheckIcon className="h-6 w-6 text-blue" />
                  <CardTitle>Client {clientId}</CardTitle>
                </div>
                <CardDescription className="text-slate-500">
                  Fraud detection node
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <ul className="space-y-1.5 text-sm text-slate-500">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue"></span>
                      Data analysis
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue"></span>
                      Model training
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue"></span>
                      Prediction service
                    </li>
                  </ul>
                  <Link
                    to={`/client/${clientId}/dashboard`}
                    className="w-full py-2 px-3 bg-white text-blue border border-blue rounded-md text-center font-medium hover:bg-blue-50 transition-colors"
                  >
                    Launch Client {clientId}
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 text-center text-slate-500 text-sm">
          <p>Decentralized Hybrid Fraud Detection System Demo</p>
        </div>
      </div>
    </div>
  );
};

export default AppSelector;
