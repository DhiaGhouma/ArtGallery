import { useEffect, useState } from 'react';
import { Sparkles, Award, Star, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';

interface EvaluationData {
  id: number;
  username: string;
  score: number;
  badge: string;
  last_evaluated?: string;
}

const Evaluation = () => {
  const [users, setUsers] = useState<EvaluationData[]>([]);
  const [loadingId, setLoadingId] = useState<number | null>(null);

  // Récupération des utilisateurs avec leurs scores
  const fetchEvaluations = async () => {
  try {
    // Appelle ton endpoint
    const data: any[] = await api.evaluation.getEvaluations();

    // Transforme les données pour correspondre à EvaluationData
    const formatted: EvaluationData[] = data.map((item) => ({
      id: item.id ?? item.user ?? 0, // ID de l'utilisateur
      username: item.username ?? item.user_name ?? 'Utilisateur', // Nom d'utilisateur
      score: item.score ?? 0, // Score par défaut à 0
      badge: item.badge ?? 'Non évalué', // Badge par défaut
      last_evaluated: item.last_evaluated ?? undefined, // Date optionnelle
    }));

    // Met à jour le state
    setUsers(formatted);
  } catch (error) {
    console.error('Erreur lors du chargement des utilisateurs:', error);
  }
};


  // Évaluation d’un utilisateur
  const evaluateUser = async (userId: number) => {
    setLoadingId(userId);
    try {
      const data = await api.evaluation.evaluateUser(userId);
      alert(`✅ Évaluation terminée : Score ${data.score} - Badge ${data.badge}`);
      await fetchEvaluations();
    } catch (error) {
      console.error('Erreur IA:', error);
      alert('Erreur lors de l’évaluation IA');
    } finally {
      setLoadingId(null);
    }
  };

  useEffect(() => {
    fetchEvaluations();
  }, []);

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-5xl sm:text-7xl font-bold gradient-text mb-4">Classement IA</h1>
          <p className="text-xl text-muted-foreground">
            Classement des contributeurs selon leurs performances
          </p>
        </div>

        <div className="glass-effect rounded-2xl p-6 space-y-6 animate-scale-in">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold gradient-text flex items-center gap-2">
              <Award className="w-6 h-6 text-primary" /> Liste des contributeurs
            </h2>
            <Button onClick={fetchEvaluations} variant="outline" size="sm" className="gap-2">
              <RefreshCcw className="w-4 h-4" /> Actualiser
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4">Nom d’utilisateur</th>
                  <th className="text-left py-3 px-4">Score</th>
                  <th className="text-left py-3 px-4">Badge</th>
                  <th className="text-left py-3 px-4">Dernière évaluation</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-primary/10 transition-all">
                    <td className="py-3 px-4 font-semibold">{user.username}</td>
                    <td className="py-3 px-4">{user.score}</td>
                    <td className="py-3 px-4 flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-500" />
                      {user.badge}
                    </td>
                    <td className="py-3 px-4">
                      {user.last_evaluated
                        ? new Date(user.last_evaluated).toLocaleDateString()
                        : 'Jamais évalué'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Button
                        onClick={() => evaluateUser(user.id)}
                        size="sm"
                        className="glow-effect"
                        disabled={loadingId === user.id}
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        {loadingId === user.id ? 'Évaluation...' : 'Évaluer'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {users.length === 0 && (
              <p className="text-center text-muted-foreground mt-4">Aucun utilisateur trouvé</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Evaluation;
