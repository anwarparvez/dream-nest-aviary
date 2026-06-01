'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function TestTabsPage() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-8">Tabs Component Test</h1>
      
      {/* Horizontal Tabs - This is the correct layout */}
      <Card>
        <CardHeader>
          <CardTitle>Horizontal Tabs (Default)</CardTitle>
          <CardDescription>
            Tabs should display horizontally with content below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="flex w-full">
              <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
              <TabsTrigger value="details" className="flex-1">Details</TabsTrigger>
              <TabsTrigger value="settings" className="flex-1">Settings</TabsTrigger>
              <TabsTrigger value="analytics" className="flex-1">Analytics</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="mt-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-semibold mb-2">Overview Content</h3>
                <p>This content appears BELOW the tabs, not on the side.</p>
              </div>
            </TabsContent>
            
            <TabsContent value="details" className="mt-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h3 className="font-semibold mb-2">Details Content</h3>
                <p>Content is displayed below the tab buttons.</p>
              </div>
            </TabsContent>
            
            <TabsContent value="settings" className="mt-4">
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <h3 className="font-semibold mb-2">Settings Content</h3>
                <p>Settings content appears in the main area below the tabs.</p>
              </div>
            </TabsContent>
            
            <TabsContent value="analytics" className="mt-4">
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <h3 className="font-semibold mb-2">Analytics Content</h3>
                <p>Analytics data displayed below the horizontal tabs.</p>
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="mt-6 p-3 bg-gray-100 rounded-lg">
            <p className="text-sm">
              Current active tab: <strong>{activeTab}</strong>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Alternative: Using grid layout for tabs list */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Grid Layout Tabs</CardTitle>
          <CardDescription>Using grid for equal width tabs</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="tab1" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="tab1">Tab 1</TabsTrigger>
              <TabsTrigger value="tab2">Tab 2</TabsTrigger>
              <TabsTrigger value="tab3">Tab 3</TabsTrigger>
            </TabsList>
            <TabsContent value="tab1" className="mt-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p>Content for Tab 1 - Below the tabs</p>
              </div>
            </TabsContent>
            <TabsContent value="tab2" className="mt-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p>Content for Tab 2 - Below the tabs</p>
              </div>
            </TabsContent>
            <TabsContent value="tab3" className="mt-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p>Content for Tab 3 - Below the tabs</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}