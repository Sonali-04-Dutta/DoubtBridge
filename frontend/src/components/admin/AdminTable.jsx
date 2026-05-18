const AdminTable = ({ columns, rows, emptyText = "No records found." }) => (
  <div className="overflow-hidden rounded-[26px] border border-white/80 bg-white/65 shadow-card backdrop-blur-xl">
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-white/10 text-left text-sm">
        <thead className="bg-brand-50/80 text-xs uppercase text-brand-500">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className="whitespace-nowrap px-4 py-3 font-bold">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10">
          {rows.length ? (
            rows.map((row) => (
              <tr key={row.id} className="text-slate-700 transition hover:bg-white/75">
                {columns.map((column) => (
                  <td key={column.key} className="whitespace-nowrap px-4 py-3 align-middle">
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center text-slate-500">
                <div className="mx-auto mb-3 grid h-20 w-20 place-items-center rounded-[28px] bg-brand-50 text-4xl">✦</div>
                <p className="font-semibold">{emptyText}</p>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);

export default AdminTable;
