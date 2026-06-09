import { Phase } from '@/types/database';

interface AssignmentSettingsProps {
    formData: Partial<Phase>;
    setFormData: React.Dispatch<React.SetStateAction<Partial<Phase>>>;
}

export default function AssignmentSettings({ formData, setFormData }: AssignmentSettingsProps) {
    return (
        <>
            <div className="sm:col-span-6">
                <label htmlFor="min_seconds_required" className="block text-sm font-bold text-gray-700">
                    Minimum Time Spent (Minutes) to Unlock Assignment
                </label>
                <div className="mt-1 flex items-center">
                    <input
                        type="number"
                        name="min_seconds_required"
                        id="min_seconds_required"
                        min="0"
                        step="0.1"
                        placeholder="e.g. 0.5 for 30 seconds"
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border text-gray-900"
                        value={isNaN(formData.min_seconds_required as number) ? '' : (formData.min_seconds_required ? formData.min_seconds_required / 60 : 0)}
                        onChange={(e) => {
                            const val = e.target.value === '' ? NaN : parseFloat(e.target.value) * 60;
                            setFormData((prev: any) => ({ ...prev, min_seconds_required: val }));
                        }}
                    />
                    <span className="ml-3 text-sm text-gray-500">minutes</span>
                </div>
                <p className="mt-1 text-xs text-gray-400 italic">Students must spend at least this much time on the phase page before they can submit (0 = Requires Video Completion).</p>
            </div>

            <div className="sm:col-span-6">
                <div className="flex items-start">
                    <div className="flex items-center h-5">
                        <input
                            id="bypass_time_requirement"
                            name="bypass_time_requirement"
                            type="checkbox"
                            className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                            checked={formData.bypass_time_requirement || false}
                            onChange={(e) => setFormData((prev: any) => ({ ...prev, bypass_time_requirement: e.target.checked }))}
                        />
                    </div>
                    <div className="ml-3 text-sm">
                        <label htmlFor="bypass_time_requirement" className="font-medium text-gray-700">Allow Immediate Submission (Bypass Time Requirement)</label>
                        <p className="text-gray-500">If checked, students can submit assignments immediately without waiting for the minimum time or watching the video.</p>
                    </div>
                </div>
            </div>

            <div className="sm:col-span-6">
                <label htmlFor="total_assignments" className="block text-sm font-bold text-gray-700">
                    Total Assignments Required
                </label>
                <div className="mt-1">
                    <input
                        type="number"
                        name="total_assignments"
                        id="total_assignments"
                        min="1"
                        max="10"
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border text-gray-900"
                        value={isNaN(formData.total_assignments as number) ? '' : (formData.total_assignments || 1)}
                        onChange={(e) => {
                            const val = e.target.value === '' ? NaN : parseInt(e.target.value);
                            setFormData((prev: any) => ({ ...prev, total_assignments: val }));
                        }}
                    />
                </div>
                <p className="mt-1 text-xs text-gray-400 italic">How many separate assignments must the student submit for this phase?</p>
            </div>

            {(formData.total_assignments || 1) > 1 && (
                <div className="sm:col-span-6 bg-gray-50 p-4 rounded-xl border border-gray-200 mt-4">
                    <h3 className="text-sm font-bold text-gray-900 mb-3">Specific Submission Types per Assignment</h3>
                    <div className="space-y-4">
                        {Array.from({ length: formData.total_assignments || 1 }).map((_, idx) => (
                            <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-2">
                                <label className="text-sm font-medium text-gray-700 sm:w-1/3">
                                    Assignment {idx + 1}
                                </label>
                                <select
                                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:w-2/3 sm:text-sm border-gray-300 rounded-md py-2 px-3 border text-gray-900"
                                    value={formData.assignment_submission_types?.[idx] || 'both'}
                                    onChange={(e) => {
                                        const newTypes = [...(formData.assignment_submission_types || [])];
                                        newTypes[idx] = e.target.value;
                                        setFormData((prev: any) => ({ ...prev, assignment_submission_types: newTypes }));
                                    }}
                                >
                                    <option value="both">Both (GitHub Link & File Upload)</option>
                                    <option value="github">GitHub Link Only</option>
                                    <option value="file">File Upload Only</option>
                                    <option value="web">Web URL (Deployed Link) Only</option>
                                </select>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="sm:col-span-6 border-t border-gray-100 pt-6">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <div>
                        <h3 className="text-sm font-bold text-gray-900">Mandatory Phase</h3>
                        <p className="text-xs text-gray-500">If disabled, students won't be revoked for missing this deadline.</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setFormData((prev: any) => ({ ...prev, is_mandatory: !prev.is_mandatory }))}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ring-2 ring-transparent ring-offset-2 ${formData.is_mandatory ? 'bg-blue-600' : 'bg-gray-200'}`}
                    >
                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${formData.is_mandatory ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                </div>
            </div>
        </>
    );
}
