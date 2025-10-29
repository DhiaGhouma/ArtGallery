import { useEffect, useState } from 'react';
import { Sparkles, Award, Star, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import axios from 'axios';

interface Evaluation {
  id: number;
  user: string;
  score: number;
  badge: string;
  last_evaluated: string;
}

const Evaluation = () => {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchEvaluations = async () => {
    try {
      const res = await axios.get('http://localhost:8000/evaluation/evaluations/');
      setEvaluations(res.data);
    } catch (error) {
      console.error('Erreur lors du chargement des évaluations:', error);
    }
  };

  const evaluateUser = async (userId: number) => {
    setLoading(true);
    try {
      const res = await axios.post(`http://localhost:8000/evaluation/evaluations/${userId}/evaluate/`);
      alert(`Évaluation terminée : Score ${res.data.score} - Badge ${res.data.badge}`);
      fetchEvaluations();
    } catch (error) {
      alert('Erreur lors de l’évaluation IA');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvaluations();
  }, []);

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-5xl sm:text-7xl font-bold gradient-text mb-4">Évaluation IA</h1>
          <p className="text-xl text-muted-foreground">
            Classement intelligent des artistes selon leurs contributions
          </p>
        </div>

        <div className="glass-effect rounded-2xl p-6 space-y-6 animate-scale-in">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold gradient-text flex items-center gap-2">
              <Award className="w-6 h-6 text-primary" /> Classement des artistes
            </h2>
            <Button onClick={fetchEvaluations} variant="outline" size="sm" className="gap-2">
              <RefreshCcw className="w-4 h-4" /> Actualiser
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4">Artiste</th>
                  <th className="text-left py-3 px-4">Score</th>
                  <th className="text-left py-3 px-4">Badge</th>
                  <th className="text-left py-3 px-4">Dernière évaluation</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {evaluations.map((evalData) => (
                  <tr key={evalData.id} className="hover:bg-primary/10 transition-all">
                    <td className="py-3 px-4">{evalData.user}</td>
                    <td className="py-3 px-4 font-semibold">{evalData.score}</td>
                    <td className="py-3 px-4 flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-500" />
                      {evalData.badge}
                    </td>
                    <td className="py-3 px-4">{new Date(evalData.last_evaluated).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-center">
                      <Button
                        onClick={() => evaluateUser(evalData.id)}
                        size="sm"
                        className="glow-effect"
                        disabled={loading}
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        {loading ? 'Évaluation...' : 'Évaluer'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {evaluations.length === 0 && (
              <p className="text-center text-muted-foreground mt-4">Aucune évaluation disponible</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Evaluation;
