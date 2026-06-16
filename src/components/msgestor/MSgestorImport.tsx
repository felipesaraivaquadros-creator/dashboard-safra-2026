"use client";

import React, { useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { FileUploadStep } from './FileUploadStep';
import { ColumnMappingStep } from './ColumnMappingStep';
import { DataReviewStep } from './DataReviewStep';
import { SaveStep } from './SaveStep';
import { ParsedRow, MS_GESTOR_COLUMNS } from './types';
import { useMSgestorImport } from './useMSgestorImport';

export default function MSgestorImport() {
  const params = useParams();
  const safraId = params.safraId as string;

  const {
    stage,
    setStage,
    parsedData,
    setParsedData,
    columnMapping,
    setColumnMapping,
    defaultValues,
    setDefaultValues,
    selectedRows,
    setSelectedRows,
    filters,
    setFilters,
    validRowsToSave,
    loading,
    handleFileChange,
    checkDuplicatesInDB,
    updateRowField,
    updateDefaultValue,
    updateColumnMapping,
    removeRows,
    toggleRowSelection,
    toggleAllSelection,
    handleSave,
    downloadTemplate,
    exportProcessedData,
    reprocessData,
    getFilteredData,
    saveResults
  } = useMSgestorImport(safraId);

  const renderStep = () => {
    switch (stage) {
      case 'upload':
        return (
          <FileUploadStep
            loading={loading}
            onFileChange={handleFileChange}
            onDownloadTemplate={downloadTemplate}
            columns={MS_GESTOR_COLUMNS}
          />
        );
      case 'mapping':
        return (
          <ColumnMappingStep
            parsedData={parsedData}
            columnMapping={columnMapping}
            onMappingChange={updateColumnMapping}
            onNext={() => setStage('review')}
            onBack={() => setStage('upload')}
            defaultValues={defaultValues}
            onDefaultChange={updateDefaultValue}
          />
        );
      case 'review':
        return (
          <DataReviewStep
            parsedData={parsedData}
            columnMapping={columnMapping}
            defaultValues={defaultValues}
            selectedRows={selectedRows}
            filters={filters}
            validRowsToSave={validRowsToSave}
            loading={loading}
            onFiltersChange={setFilters}
            onSelectionChange={setSelectedRows}
            onToggleRow={toggleRowSelection}
            onToggleAll={toggleAllSelection}
            onUpdateField={updateRowField}
            onUpdateDefault={updateDefaultValue}
            onUpdateMapping={updateColumnMapping}
            onRemoveRows={removeRows}
            onCheckDuplicates={checkDuplicatesInDB}
            onExport={exportProcessedData}
            onBack={() => setStage('mapping')}
            onSave={handleSave}
            getFilteredData={getFilteredData}
          />
        );
      case 'saving':
        return <SaveStep loading={loading} />;
      case 'done':
        return (
          <SaveStep
            loading={false}
            done={true}
            saveResults={saveResults}
            onNewImport={() => setStage('upload')}
            onBackToReview={() => setStage('review')}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-full mx-auto p-4 md:p-6">
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        {/* Progress Indicator */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black uppercase italic tracking-tighter">
              Importação MS Gestor → <span className="text-purple-600">{safraId}</span>
            </h2>
            <div className="flex items-center gap-4">
              {['upload', 'mapping', 'review', 'saving', 'done'].map((step, idx) => (
                <div key={step} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                    ['upload', 'mapping', 'review'].indexOf(stage) >= idx 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                  }`}>
                    {idx + 1}
                  </div>
                  {idx < 4 && (
                    <div className={`w-16 h-1 mx-2 rounded ${
                      ['upload', 'mapping', 'review'].indexOf(stage) > idx 
                        ? 'bg-purple-600' 
                        : 'bg-slate-200 dark:bg-slate-700'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 min-h-[500px]">
          {renderStep()}
        </div>
      </div>
    </div>
  );
}