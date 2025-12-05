import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabaseAdmin } from "@/lib/supabase";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function AdminDashboard() {
    const session = await getServerSession(authOptions);

    // @ts-ignore
    if (session?.user?.role !== 'admin') {
        redirect('/dashboard');
    }

    // Fetch stats
    const { count: openCount } = await supabaseAdmin
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Open');

    const { count: inProgressCount } = await supabaseAdmin
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'In Progress');

    const { count: resolvedCount } = await supabaseAdmin
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Resolved');

    // Fetch recent tickets
    const { data: recentTickets } = await supabaseAdmin
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    return (
        <div>
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight mb-6">
                Dashboard Overview
            </h2>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <dt className="text-sm font-medium text-gray-500 truncate">Open Tickets</dt>
                        <dd className="mt-1 text-3xl font-semibold text-gray-900">{openCount || 0}</dd>
                    </div>
                </div>
                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <dt className="text-sm font-medium text-gray-500 truncate">In Progress</dt>
                        <dd className="mt-1 text-3xl font-semibold text-gray-900">{inProgressCount || 0}</dd>
                    </div>
                </div>
                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <dt className="text-sm font-medium text-gray-500 truncate">Resolved</dt>
                        <dd className="mt-1 text-3xl font-semibold text-gray-900">{resolvedCount || 0}</dd>
                    </div>
                </div>
            </div>

            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Recent Tickets</h3>
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul role="list" className="divide-y divide-gray-200">
                    {recentTickets && recentTickets.map((ticket) => (
                        <li key={ticket.id}>
                            <Link href={`/admin/tickets/${ticket.id}`} className="block hover:bg-gray-50">
                                <div className="px-4 py-4 sm:px-6">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium text-indigo-600 truncate">{ticket.title}</p>
                                        <div className="ml-2 flex-shrink-0 flex">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${ticket.status === 'Open' ? 'bg-green-100 text-green-800' :
                                                    ticket.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-gray-100 text-gray-800'
                                                }`}>
                                                {ticket.status}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="mt-2 sm:flex sm:justify-between">
                                        <div className="sm:flex">
                                            <p className="flex items-center text-sm text-gray-500">
                                                #{ticket.id}
                                            </p>
                                            <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                                                {ticket.created_by_email}
                                            </p>
                                        </div>
                                        <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                            <p>
                                                Created on <time dateTime={ticket.created_at}>{new Date(ticket.created_at).toLocaleDateString()}</time>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>
            <div className="mt-4 text-right">
                <Link href="/admin/tickets" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                    View all tickets &rarr;
                </Link>
            </div>
        </div>
    );
}
