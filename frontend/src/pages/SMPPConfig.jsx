const SMPPConfig = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-surface-900">SMPP Configuration</h2>
        <p className="mt-1 text-sm text-surface-500">Manage global SMPP server settings and performance tunings.</p>
      </div>

      <div className="bg-white shadow-card rounded-xl border border-surface-200">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-surface-900 mb-4">Core System Settings</h3>
          
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-3">
              <label className="block text-sm font-medium text-surface-700">System ID</label>
              <input type="text" defaultValue="" className="mt-1 block w-full border border-surface-200 rounded-lg shadow-sm py-2 px-3 focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-sm font-medium text-surface-700">System Type</label>
              <input type="text" defaultValue="" className="mt-1 block w-full border border-surface-200 rounded-lg shadow-sm py-2 px-3 focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-surface-700">Max Connections (Global)</label>
              <input type="number" defaultValue="" className="mt-1 block w-full border border-surface-200 rounded-lg shadow-sm py-2 px-3 focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-surface-700">Window Size</label>
              <input type="number" defaultValue="" className="mt-1 block w-full border border-surface-200 rounded-lg shadow-sm py-2 px-3 focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-surface-700">Enquire Link Timer (s)</label>
              <input type="number" defaultValue="" className="mt-1 block w-full border border-surface-200 rounded-lg shadow-sm py-2 px-3 focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
            </div>
          </div>
        </div>
        <div className="px-4 py-3 bg-surface-50 text-right sm:px-6 rounded-b-xl">
          <button className="bg-primary-600 border border-transparent rounded-lg shadow-sm py-2 px-4 inline-flex justify-center text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};

export default SMPPConfig;
