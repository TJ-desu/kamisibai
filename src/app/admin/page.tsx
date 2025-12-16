import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getVideos, getUsers } from '@/lib/data';
import { signVideoUrls } from '@/lib/s3';
import AdminDashboard from '@/app/components/AdminDashboard';


export default async function AdminPage() {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token');

    if (!token) {
        redirect('/login');
    }

    const user = JSON.parse(token.value);
    const rawVideos = await getVideos();
    // Sign URLs for private S3 access
    const videos = await signVideoUrls(rawVideos);

    const users = (await getUsers()).map(({ password, ...u }) => ({ ...u, password: '' })); // Hide passwords

    return <AdminDashboard user={user} initialVideos={videos} initialUsers={users} />;
}
