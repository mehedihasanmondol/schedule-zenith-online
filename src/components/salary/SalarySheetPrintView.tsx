
import { Payroll } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

interface SalarySheetPrintViewProps {
  payrolls: Payroll[];
  period: string;
}

export const SalarySheetPrintView = ({ payrolls, period }: SalarySheetPrintViewProps) => {
  const handlePrint = () => {
    window.print();
  };

  const totalGrossPay = payrolls.reduce((sum, p) => sum + p.gross_pay, 0);
  const totalDeductions = payrolls.reduce((sum, p) => sum + p.deductions, 0);
  const totalNetPay = payrolls.reduce((sum, p) => sum + p.net_pay, 0);
  const totalHours = payrolls.reduce((sum, p) => sum + p.total_hours, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-end print:hidden">
        <Button onClick={handlePrint} className="flex items-center gap-2">
          <Printer className="h-4 w-4" />
          Print Salary Sheet
        </Button>
      </div>

      <div className="print:bg-white bg-white p-8 rounded-lg shadow-lg">
        {/* Header */}
        <div className="border-b-2 border-gray-800 pb-4 mb-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800">SALARY SHEET</h1>
            <p className="text-lg text-gray-600">Pay Period: {period}</p>
            <p className="text-sm text-gray-500">Generated on: {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        {/* Summary Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 bg-gray-50 p-4 rounded">
          <div className="text-center">
            <div className="text-sm text-gray-600">Total Employees</div>
            <div className="text-xl font-bold">{payrolls.length}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600">Total Hours</div>
            <div className="text-xl font-bold">{totalHours.toFixed(1)}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600">Gross Pay</div>
            <div className="text-xl font-bold">${totalGrossPay.toFixed(2)}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600">Net Pay</div>
            <div className="text-xl font-bold text-green-600">${totalNetPay.toFixed(2)}</div>
          </div>
        </div>

        {/* Payroll Table */}
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 py-2 px-3 text-left text-sm font-semibold">S.No</th>
              <th className="border border-gray-300 py-2 px-3 text-left text-sm font-semibold">Employee Name</th>
              <th className="border border-gray-300 py-2 px-3 text-left text-sm font-semibold">Role</th>
              <th className="border border-gray-300 py-2 px-3 text-center text-sm font-semibold">Hours</th>
              <th className="border border-gray-300 py-2 px-3 text-center text-sm font-semibold">Rate ($/hr)</th>
              <th className="border border-gray-300 py-2 px-3 text-right text-sm font-semibold">Gross Pay ($)</th>
              <th className="border border-gray-300 py-2 px-3 text-right text-sm font-semibold">Deductions ($)</th>
              <th className="border border-gray-300 py-2 px-3 text-right text-sm font-semibold">Net Pay ($)</th>
              <th className="border border-gray-300 py-2 px-3 text-center text-sm font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {payrolls.map((payroll, index) => (
              <tr key={payroll.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="border border-gray-300 py-2 px-3 text-sm">{index + 1}</td>
                <td className="border border-gray-300 py-2 px-3 text-sm font-medium">
                  {payroll.profiles?.full_name || 'N/A'}
                </td>
                <td className="border border-gray-300 py-2 px-3 text-sm">
                  {payroll.profiles?.role || 'N/A'}
                </td>
                <td className="border border-gray-300 py-2 px-3 text-center text-sm">
                  {payroll.total_hours.toFixed(1)}
                </td>
                <td className="border border-gray-300 py-2 px-3 text-center text-sm">
                  {payroll.hourly_rate.toFixed(2)}
                </td>
                <td className="border border-gray-300 py-2 px-3 text-right text-sm">
                  {payroll.gross_pay.toFixed(2)}
                </td>
                <td className="border border-gray-300 py-2 px-3 text-right text-sm text-red-600">
                  {payroll.deductions.toFixed(2)}
                </td>
                <td className="border border-gray-300 py-2 px-3 text-right text-sm font-semibold">
                  {payroll.net_pay.toFixed(2)}
                </td>
                <td className="border border-gray-300 py-2 px-3 text-center text-sm">
                  <span className={`px-2 py-1 rounded text-xs ${
                    payroll.status === 'paid' ? 'bg-green-100 text-green-800' :
                    payroll.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {payroll.status.toUpperCase()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-200 font-semibold">
              <td colSpan={3} className="border border-gray-300 py-2 px-3 text-right text-sm">
                TOTALS:
              </td>
              <td className="border border-gray-300 py-2 px-3 text-center text-sm">
                {totalHours.toFixed(1)}
              </td>
              <td className="border border-gray-300 py-2 px-3 text-center text-sm">-</td>
              <td className="border border-gray-300 py-2 px-3 text-right text-sm">
                {totalGrossPay.toFixed(2)}
              </td>
              <td className="border border-gray-300 py-2 px-3 text-right text-sm">
                {totalDeductions.toFixed(2)}
              </td>
              <td className="border border-gray-300 py-2 px-3 text-right text-sm font-bold">
                {totalNetPay.toFixed(2)}
              </td>
              <td className="border border-gray-300 py-2 px-3 text-center text-sm">-</td>
            </tr>
          </tfoot>
        </table>

        {/* Footer */}
        <div className="mt-8 flex justify-between items-end">
          <div>
            <p className="text-sm text-gray-600">Prepared by: _________________</p>
            <p className="text-sm text-gray-600 mt-2">Date: _________________</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Approved by: _________________</p>
            <p className="text-sm text-gray-600 mt-2">Signature: _________________</p>
          </div>
        </div>

        <div className="mt-6 text-xs text-gray-500 text-center border-t pt-4">
          <p>This is a computer-generated salary sheet. Please verify all details before processing payments.</p>
        </div>
      </div>
    </div>
  );
};
