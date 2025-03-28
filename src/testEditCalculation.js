// Arquivo de teste para edição no Supabase
import { supabase } from './lib/supabase';

// Função para testar a atualização de um cálculo
export async function testUpdateCalculation(calculationId) {
  if (!calculationId) {
    console.error('ID de cálculo não fornecido');
    return { success: false, error: 'ID de cálculo não fornecido' };
  }
  
  try {
    // Dados mínimos para atualização
    const updateData = {
      total_cost: 1000,
      cost_per_m2: 100,
      total_area: 10
    };
    
    console.log('Tentando atualizar cálculo com ID:', calculationId);
    console.log('Dados de atualização:', updateData);
    
    const { data, error } = await supabase
      .from('calculations')
      .update(updateData)
      .eq('id', calculationId)
      .select();
      
    if (error) {
      console.error('Erro na atualização:', error);
      return { success: false, error };
    }
    
    console.log('Atualização bem-sucedida:', data);
    return { success: true, data };
  } catch (err) {
    console.error('Exceção ao atualizar:', err);
    return { success: false, error: err };
  }
}

// Exportar uma função que pode ser chamada diretamente do console
window.testUpdateCalculation = testUpdateCalculation; 