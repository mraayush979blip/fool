import { X, Video, FileText, Upload } from 'lucide-react';
import { PhaseOption } from '@/types/database';

interface PhaseOptionsBuilderProps {
    options: PhaseOption[];
    optionFiles: Record<string, File>;
    handleAddOption: () => void;
    handleRemoveOption: (id: string) => void;
    handleUpdateOption: (id: string, updates: Partial<PhaseOption>) => void;
    handleOptionFileSelect: (e: React.ChangeEvent<HTMLInputElement>, optionId: string) => void;
    handleRemoveOptionFile: (optionId: string) => void;
}

export default function PhaseOptionsBuilder({
    options,
    optionFiles,
    handleAddOption,
    handleRemoveOption,
    handleUpdateOption,
    handleOptionFileSelect,
    handleRemoveOptionFile
}: PhaseOptionsBuilderProps) {
    return (
        <div className="sm:col-span-6 space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <h3 className="text-lg font-medium text-gray-900">Content Options</h3>
                <button
                    type="button"
                    onClick={handleAddOption}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-bold rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                >
                    + Add New Option
                </button>
            </div>

            {options?.map((option, index) => (
                <div key={option.id} className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 relative">
                    <button
                        type="button"
                        onClick={() => handleRemoveOption(option.id)}
                        className="absolute top-4 right-4 p-1 text-slate-400 hover:text-red-500 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>

                    <div className="flex items-center gap-2 mb-2">
                        <span className="bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest">Option {index + 1}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2">
                            <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-1">Option Title</label>
                            <input
                                type="text"
                                placeholder="e.g. Solution using Python"
                                className="w-full text-sm font-medium border-slate-200 focus:ring-indigo-500 focus:border-indigo-500 px-3 py-2 border rounded-md"
                                value={option.title}
                                onChange={(e) => handleUpdateOption(option.id, { title: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-1">YouTube Video URL</label>
                            <input
                                type="url"
                                placeholder="YouTube Link"
                                className="w-full text-sm font-medium border-slate-200 focus:ring-indigo-500 focus:border-indigo-500 px-3 py-2 border rounded-md"
                                value={option.youtube_url}
                                onChange={(e) => handleUpdateOption(option.id, { youtube_url: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-1">Resource URL (Optional)</label>
                            <input
                                type="url"
                                placeholder="GitHub or External Link"
                                className="w-full text-sm font-medium border-slate-200 focus:ring-indigo-500 focus:border-indigo-500 px-3 py-2 border rounded-md"
                                value={option.assignment_resource_url}
                                onChange={(e) => handleUpdateOption(option.id, { assignment_resource_url: e.target.value })}
                            />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-1">Allowed Submission Type</label>
                            <select
                                className="w-full text-sm font-medium border-slate-200 focus:ring-indigo-500 focus:border-indigo-500 px-3 py-2 border rounded-md"
                                value={option.allowed_submission_type || 'both'}
                                onChange={(e) => handleUpdateOption(option.id, { allowed_submission_type: e.target.value as any })}
                            >
                                <option value="both">Both (GitHub & File)</option>
                                <option value="github">GitHub Link Only</option>
                                <option value="file">File Upload Only</option>
                            </select>
                        </div>
                        <div className="sm:col-span-2">
                            <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-1">Assignment PDF</label>
                            <div className="flex items-center gap-4 mt-1">
                                {(option.assignment_file_url || optionFiles[option.id]) ? (
                                    <div className="flex items-center justify-between flex-1 p-3 bg-white border border-slate-200 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <FileText className="h-5 w-5 text-indigo-500" />
                                            <span className="text-xs font-bold truncate max-w-[200px]">
                                                {optionFiles[option.id] ? optionFiles[option.id].name : option.assignment_file_url?.split('/').pop()}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveOptionFile(option.id)}
                                            className="text-red-500 hover:text-red-700 text-xs font-bold"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ) : (
                                    <label className="flex-1 flex items-center justify-center p-3 border-2 border-dashed border-slate-300 rounded-xl hover:border-indigo-400 cursor-pointer transition-colors bg-white">
                                        <Upload className="h-4 w-4 text-slate-400 mr-2" />
                                        <span className="text-xs font-bold text-slate-500">Upload PDF</span>
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept=".pdf,image/png,image/jpeg,image/jpg"
                                            onChange={(e) => handleOptionFileSelect(e, option.id)}
                                        />
                                    </label>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ))}

            {(!options || options.length === 0) && (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                    <Video className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No options added yet</p>
                    <button
                        type="button"
                        onClick={handleAddOption}
                        className="mt-4 text-indigo-600 font-bold text-xs"
                    >
                        + Click to add your first option
                    </button>
                </div>
            )}
        </div>
    );
}
