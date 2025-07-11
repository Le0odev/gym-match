import React, { useState, useEffect } from 'react';
import { matchesAPI } from '../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Dumbbell, Heart, MessageCircle, Calendar, Star } from 'lucide-react';

const Matches = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    try {
      const response = await matchesAPI.getMatches();
      setMatches(response.data);
    } catch (error) {
      console.error('Failed to load matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <Dumbbell className="h-8 w-8 text-primary mr-2" />
                <h1 className="text-xl font-bold text-gray-900">Meus Matches</h1>
              </div>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Dumbbell className="h-8 w-8 text-primary mr-2" />
              <h1 className="text-xl font-bold text-gray-900">Meus Matches</h1>
            </div>
            <div className="flex items-center">
              <Heart className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-sm text-gray-600">{matches.length} matches</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {matches.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Nenhum match ainda
            </h3>
            <p className="text-gray-600 mb-6">
              Continue descobrindo parceiros para fazer seus primeiros matches!
            </p>
            <Button>
              <Dumbbell className="h-4 w-4 mr-2" />
              Descobrir Parceiros
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matches.map((match) => (
              <Card key={match.matchId} className="hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                    {match.user.name.charAt(0).toUpperCase()}
                  </div>
                  <CardTitle className="text-lg">{match.user.name}</CardTitle>
                  <CardDescription>
                    <div className="flex items-center justify-center">
                      <Star className="h-4 w-4 text-yellow-500 mr-1" />
                      <span>{match.compatibilityScore}% compatível</span>
                    </div>
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Physical Stats */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {match.user.height && (
                      <div>
                        <span className="text-gray-500">Altura:</span>
                        <span className="ml-1 font-medium">{match.user.height} cm</span>
                      </div>
                    )}
                    {match.user.weight && (
                      <div>
                        <span className="text-gray-500">Peso:</span>
                        <span className="ml-1 font-medium">{match.user.weight} kg</span>
                      </div>
                    )}
                  </div>

                  {/* Goal */}
                  {match.user.goal && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Objetivo:</p>
                      <p className="text-sm bg-gray-50 p-2 rounded">{match.user.goal}</p>
                    </div>
                  )}

                  {/* Workout Preferences */}
                  {match.user.workoutPreferences && match.user.workoutPreferences.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Treinos favoritos:</p>
                      <div className="flex flex-wrap gap-1">
                        {match.user.workoutPreferences.slice(0, 3).map((pref) => (
                          <Badge key={pref.id} variant="secondary" className="text-xs">
                            {pref.name}
                          </Badge>
                        ))}
                        {match.user.workoutPreferences.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{match.user.workoutPreferences.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Match Date */}
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>Match em {formatDate(match.createdAt)}</span>
                  </div>

                  {/* Action Button */}
                  <Button className="w-full" variant="outline">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Iniciar Conversa
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Matches;

