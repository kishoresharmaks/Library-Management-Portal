import React, { useState, useEffect } from 'react';
import { Save, Settings as SettingsIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

function Settings() {
  const [defaultReturnDays, setDefaultReturnDays] = useState(15);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Table doesn't exist or no data, use default value
          await saveSettings(defaultReturnDays);
        } else {
          throw error;
        }
      } else if (data) {
        setDefaultReturnDays(data.default_return_days);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Error loading settings');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (days: number) => {
    try {
      const { error } = await supabase
        .from('settings')
        .upsert({ id: 1, default_return_days: days });

      if (error) throw error;
      
      setDefaultReturnDays(days);
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Error saving settings');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <SettingsIcon className="h-6 w-6 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-base font-medium text-gray-900 mb-4">Book Return Settings</h3>
        
        <div className="max-w-md">
          <label htmlFor="returnDays" className="block text-sm font-medium text-gray-700 mb-1">
            Default Return Period (Days)
          </label>
          <div className="mt-1 flex rounded-md shadow-sm">
            <input
              type="number"
              name="returnDays"
              id="returnDays"
              min="1"
              max="365"
              value={defaultReturnDays}
              onChange={(e) => setDefaultReturnDays(parseInt(e.target.value))}
              className="flex-1 min-w-0 block w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
            <button
              onClick={() => saveSettings(defaultReturnDays)}
              className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Save className="h-4 w-4 mr-2" />
              Save
            </button>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            This setting determines how many days students have to return a book after borrowing.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Settings;