import { redirect } from 'next/navigation';

export default function RootPage() {
  // Redirigimos al portal azul que ya confirmamos que funciona
  redirect('/portal');
}
