import { ReactNode } from "react";

type Props = {
  headers: string[];
  children: ReactNode;
  empty?: ReactNode;
  colSpan?: number;
};

export default function DataTable({ headers, children, empty, colSpan }: Props) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10">
      <table className="w-full text-left text-sm">
        <thead className="bg-white/5 text-zinc-200">
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-4 py-3 font-medium">
                {header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-white/10">
          {children}

          {empty ? (
            <tr>
              <td className="px-4 py-8 text-center text-zinc-400" colSpan={colSpan ?? headers.length}>
                {empty}
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}